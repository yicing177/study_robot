<template>
  <div class="calendar_container">
    <div class="demo-app">
      <div class="demo-app-main">
        <FullCalendar class="demo-app-calendar" :options="calendarOptions">
          <!-- 月/週/日視圖中的事件內容 -->
          <template v-slot:eventContent="arg">
            <!-- 全日事件不顯示時間，只顯示標題；非全日顯示 24 小時制 -->
            <b v-if="!arg.event.allDay">{{ arg.timeText }}</b>
            <i>{{ arg.event.title }}</i>
          </template>
        </FullCalendar>
      </div>

      <div class="demo-app-sidebar">
        <h2>所有行程（{{ currentEvents.length }}）</h2>
        <ul>
          <li v-for="event in currentEvents" :key="event.id">
            <b>{{ formatEventRange(event) }}</b>
            <i>　{{ event.title }}</i>
          </li>
        </ul>
      </div>
    </div>

    <!-- ✅ 新增事件 Dialog -->
    <dialog ref="addDialog" class="nice-dialog">
      <form method="dialog" @submit.prevent="submitAddEvent">
        <h3>新增事件</h3>

        <label class="fld">
          標題
          <input
            v-model.trim="form.title"
            type="text"
            required
            placeholder="輸入事件標題"
          />
        </label>

        <label class="fld">
          說明（可選）
          <textarea
            v-model.trim="form.content"
            rows="3"
            placeholder="補充內容…（可放教材/會話ID）"
          ></textarea>
        </label>

        <label class="chk">
          <input type="checkbox" v-model="form.allDay" />
          整天事件
        </label>

        <div class="grid">
          <label class="fld">
            開始時間
            <input
              :disabled="form.allDay"
              v-model="form.startLocal"
              type="datetime-local"
              required
            />
          </label>

          <label class="fld">
            結束時間（可選）
            <input
              :disabled="form.allDay"
              v-model="form.endLocal"
              type="datetime-local"
            />
          </label>
        </div>

        <div class="btns">
          <button type="button" class="btn ghost" @click="closeAddDialog">
            取消
          </button>
          <button class="btn primary" :disabled="!form.title">建立</button>
        </div>
      </form>
    </dialog>

    <!-- ✅ 刪除事件 Dialog -->
    <dialog ref="deleteDialog" class="nice-dialog">
      <form method="dialog" @submit.prevent="confirmDelete">
        <h3>刪除事件</h3>
        <p>確認刪除「{{ toDelete.title }}」？</p>
        <div class="btns">
          <button type="button" class="btn ghost" @click="closeDeleteDialog">
            取消
          </button>
          <button class="btn danger">刪除</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";
import Greet from "@/assets/audio/a_calender_01.wav";
import { audioManager } from "@/composables/audioManager.js";

export default defineComponent({
  components: { FullCalendar },
  setup() {
    const pageGreetingKey = "greeted:calendar";
    onMounted(() => {
      // 已經打過招呼就不重播
      if (sessionStorage.getItem(pageGreetingKey)) return;

      const handler = async (event) => {
        // 小精靈被點到就不播
        if (event?.target?.closest?.(".elf-button")) {
          window.removeEventListener("click", handler);
          return;
        }
        // ✅ 使用 audioManager 的 greeting channel
        await audioManager
          .play({
            channel: "greeting",
            src: Greet,
            duckOthers: false, // 問候不壓別人；若同時有 TTS，TTS 會自動仲裁
            fadeInMs: 120,
          })
          .catch(() => {});

        sessionStorage.setItem(pageGreetingKey, "true");
        window.removeEventListener("click", handler);
      };
      window.addEventListener("click", handler);
    });
    return {};
  },
  data() {
    return {
      // ===== Dialog / 表單狀態 =====
      form: {
        title: "",
        content: "",
        allDay: true,
        startLocal: "",
        endLocal: "",
      },
      pendingSelectInfo: null, // 暫存 FullCalendar 的 selectInfo
      toDelete: { id: null, title: "" },
      _clickInfoRef: null,

      // ===== FullCalendar 設定 =====
      calendarOptions: {
        timeZone: "local", // 用本機時區；右側清單我們另用 Asia/Taipei 格式化
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
        initialView: "dayGridMonth",
        events: [],
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,

        // 月/週/日視圖中顯示的事件時間（24小時制，補零）
        eventTimeFormat: {
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
        },
        // 週標題：例「週五 9/5」
        dayHeaderFormat: { weekday: "short", month: "numeric", day: "numeric" },

        // 綁定自訂 callback（mounted 也會再明確指定一次以確保 this 綁定）
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        eventsSet: this.handleEvents,
      },
      currentEvents: [],
    };
  },
  methods: {
    // ====== 時間格式化（伴讀機器人好閱讀）======
    formatDateTime(dt) {
      if (!dt) return "";
      const d = dt instanceof Date ? dt : new Date(dt);
      return new Intl.DateTimeFormat("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(d); // 例：2025/09/05（週五） 09:30
    },
    formatEventRange(event) {
      const allDay = event.allDay;
      const start = event.start;
      const end = event.end;

      // 今天/明天友善字樣（可愛陪伴感）
      const today = new Date();
      const ymd = (d) => d.toISOString().slice(0, 10);
      const startYMD = ymd(start);
      const todayYMD = ymd(today);
      const tomorrowYMD = ymd(
        new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
      );

      const dayLabel =
        startYMD === todayYMD
          ? "今天"
          : startYMD === tomorrowYMD
          ? "明天"
          : new Intl.DateTimeFormat("zh-TW", {
              timeZone: "Asia/Taipei",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              weekday: "short",
            }).format(start);

      if (allDay) return `${dayLabel}（整天）`;

      if (!end) return this.formatDateTime(start);

      const sameDay = start.toDateString() === end.toDateString();
      if (sameDay) {
        const hm = (d) =>
          new Intl.DateTimeFormat("zh-TW", {
            timeZone: "Asia/Taipei",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(d);
        // 如果 dayLabel 是「今天/明天」，不要再重複日期
        const isSpecial = dayLabel === "今天" || dayLabel === "明天";
        return isSpecial
          ? `${dayLabel} ${hm(start)}–${hm(end)}`
          : `${dayLabel} ${hm(start)}–${hm(end)}`;
      }
      // 跨日
      return `${this.formatDateTime(start)} → ${this.formatDateTime(end)}`;
    },

    // ====== Dialog 協助方法 ======
    openAddDialog(selectInfo) {
      this.pendingSelectInfo = selectInfo;

      // FullCalendar 提供的是 Date（以 UTC 計算），轉本地 datetime-local 字串
      const toLocal = (d) =>
        new Date(d.getTime() - d.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

      const start = selectInfo.start;
      const end = selectInfo.end;

      this.form.title = "";
      this.form.content = "";
      this.form.allDay = selectInfo.allDay ?? true;
      this.form.startLocal = toLocal(start);
      this.form.endLocal = end ? toLocal(end) : "";

      if (!this.$refs.addDialog.open) this.$refs.addDialog.showModal();
    },
    closeAddDialog() {
      this.pendingSelectInfo?.view.calendar.unselect();
      this.$refs.addDialog.close();
    },
    async submitAddEvent() {
      if (!this.form.title) return;

      const selectInfo = this.pendingSelectInfo;
      if (!selectInfo) return;

      try {
        // 組 payload（可視需要把教材ID / conversation_id 塞在 content）
        const payload = {
          title: this.form.title,
          content: this.form.content || "",
          datetime: this.form.allDay
            ? selectInfo.startStr // 全日事件沿用 FullCalendar 選到的起始字串
            : new Date(this.form.startLocal).toISOString(),
          endDatetime:
            !this.form.allDay && this.form.endLocal
              ? new Date(this.form.endLocal).toISOString()
              : null,
          allDay: this.form.allDay,
        };

        const res = await axios.post(
          "http://localhost:5000/calendar",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: localStorage.getItem("token"),
            },
          }
        );

        const newEvent = res.data.calendar;

        // 新事件加入 FullCalendar（即時回饋）
        selectInfo.view.calendar.addEvent({
          id: newEvent.calendar_id,
          title: newEvent.title,
          start: newEvent.datetime,
          end: newEvent.endDatetime || undefined,
          allDay: !!newEvent.allDay,
        });

        // 成功時可播放溫柔提示音（伴讀氛圍）
        this.$refs.greetingAudio?.play?.();
      } catch (err) {
        console.error("新增失敗", err);
        alert("新增事件失敗");
      } finally {
        selectInfo.view.calendar.unselect();
        this.$refs.addDialog.close();
      }
    },

    openDeleteDialog(clickInfo) {
      this.toDelete.id = clickInfo.event.id;
      this.toDelete.title = clickInfo.event.title;
      this._clickInfoRef = clickInfo;
      if (!this.$refs.deleteDialog.open) this.$refs.deleteDialog.showModal();
    },
    closeDeleteDialog() {
      this.$refs.deleteDialog.close();
      this._clickInfoRef = null;
    },
    async confirmDelete() {
      const clickInfo = this._clickInfoRef;
      if (!clickInfo) return this.$refs.deleteDialog.close();

      try {
        await axios.delete(
          `http://localhost:5000/calendar/${clickInfo.event.id}`,
          {
            headers: { Authorization: localStorage.getItem("token") },
          }
        );
        clickInfo.event.remove();
      } catch (err) {
        console.error("刪除失敗", err);
        alert("刪除事件失敗");
      } finally {
        this.closeDeleteDialog();
      }
    },

    // ====== FullCalendar Callbacks ======
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends;
    },
    handleDateSelect(selectInfo) {
      // 使用自訂 dialog 取代 prompt
      this.openAddDialog(selectInfo);
    },
    handleEventClick(clickInfo) {
      // 使用自訂 dialog 取代 confirm
      this.openDeleteDialog(clickInfo);
    },
    handleEvents(events) {
      this.currentEvents = events;
    },
  },
  mounted() {
    // 再明確指定一次 callbacks，確保 this 綁定正確
    this.calendarOptions.select = this.handleDateSelect;
    this.calendarOptions.eventClick = this.handleEventClick;
    this.calendarOptions.eventsSet = this.handleEvents;

    // 初始拉取行程
    axios
      .get("http://localhost:5000/calendar", {
        headers: { Authorization: localStorage.getItem("token") },
      })
      .then((res) => {
        const events = res.data.map((e) => ({
          id: e.calendar_id,
          title: e.title,
          start: e.datetime,
          end: e.endDatetime || undefined,
          allDay: !!e.allDay,
        }));
        this.calendarOptions.events = events;
      })
      .catch((err) => {
        console.error("載入行事曆失敗", err);
      });
  },
});
</script>

<style scoped>
h2 {
  margin: 0;
  font-size: 16px;
}
ul {
  margin: 0;
  padding: 0 0 0 1.5em;
}
li {
  margin: 1.5em 0;
  padding: 0;
}
b {
  margin-right: 3px;
}

.calendar_container {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px 10px 0px;
  height: 100%;
}
.demo-app {
  display: flex;
  width: 80%;
  font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
  font-size: 14px;
}
.demo-app-sidebar {
  width: 300px;
  line-height: 1.5;
  background: #dfd5ce;
  border-left: 15px solid #c9b8ac;
  padding: 20px;
  margin: 20px;
  border-radius: 10px;
}
.demo-app-main {
  flex-grow: 1;
  padding: 0px;
  margin: 20px;
}
.fc {
  max-width: 1100px;
  margin: 0 auto;
}
::v-deep(.fc-event) {
  background-color: #3788d8 !important;
  border: 1px solid #3788d8 !important;
  color: #fff !important;
}

::v-deep(.fc-event i) {
  font-style: normal;
  line-height: 20px;
}

/* ✅ 漂亮的 dialog 樣式 */
.nice-dialog {
  border: none;
  border-radius: 16px;
  padding: 0;
  width: 520px;
  max-width: calc(100% - 24px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.nice-dialog::backdrop {
  background: rgba(0, 0, 0, 0.3);
}

.nice-dialog form {
  padding: 20px 20px 16px;
}
.nice-dialog h3 {
  margin: 0 0 12px;
  font-size: 18px;
}

.fld {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 10px 0;
}
.fld input[type="text"],
.fld input[type="datetime-local"],
.fld textarea {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  outline: none;
}
.fld textarea {
  resize: vertical;
}

.chk {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btns {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.btn {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 10px;
  padding: 8px 14px;
  cursor: pointer;
}
.btn.primary {
  background: #2f7cf6;
  color: #fff;
  border-color: #2f7cf6;
}
.btn.ghost {
  background: #f5f5f5;
}
.btn.danger {
  background: #e5484d;
  color: #fff;
  border-color: #e5484d;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
