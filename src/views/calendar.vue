<script>
import { defineComponent } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

export default defineComponent({
  components: {
    FullCalendar,
  },
  data() {
    return {
      calendarOptions: {
        plugins: [
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin, // needed for dateClick
        ],
        headerToolbar: {
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        },
        initialView: "dayGridMonth",
        events:[], // alternatively, use the `events` setting to fetch from a feed
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,
        select: this.handleDateSelect,
        eventClick: this.handleEventClick,
        eventsSet: this.handleEvents,
        /* you can update a remote database when these fire:
        eventAdd:
        eventChange:
        eventRemove:
        */
      },
      currentEvents: [],
    };
  },
  methods: {
    handleWeekendsToggle() {
      this.calendarOptions.weekends = !this.calendarOptions.weekends; // update a property
    },
    handleDateSelect(selectInfo) {
      let title = prompt("Please enter a new title for your event");
      if(!title) return;// ← 沒輸入就跳出
      //let calendarApi = selectInfo.view.calendar;
      //calendarApi.unselect(); // clear date selection
      const payload = {
        title,
        user_id: localStorage.getItem("uid"),  // or 你用的登入方式
        datetime: selectInfo.startStr,
        content: "",  // 可加上說明
        xposition: 0,
        yposition: 0,
      };
      console.log("送出的 payload:", payload);
    axios.post("http://localhost:5000/calendar", payload, {
      headers: {
        "Content-Type": "application/json",
      }
    })
      .then(res => {
        const newEvent = res.data.calendar;
        selectInfo.view.calendar.addEvent({
          id: newEvent.calendar_id,
          title: newEvent.title,
          start: newEvent.datetime,
          allDay: true,
        });
      })
      .catch(err => {
        console.error("新增失敗", err);
        alert("新增事件失敗");
      });
    selectInfo.view.calendar.unselect(); // 清除選取
  },

    //   if (title) {
    //     calendarApi.addEvent({
    //       id: createEventId(),
    //       title,
    //       start: selectInfo.startStr,
    //       end: selectInfo.endStr,
    //       allDay: selectInfo.allDay,
    //     });
    //   }
    // },
    handleEventClick(clickInfo) {
      if (confirm(`確認刪除事件 '${clickInfo.event.title}'？`)) {
        const id = clickInfo.event.id;
        axios.delete(`http://localhost:5000/calendar/${id}`)
          .then(() => {
            clickInfo.event.remove();
          })
          .catch(err => {
            console.error("刪除失敗", err);
            alert("刪除事件失敗");
          });
      }
    },

    handleEvents(events) {
      this.currentEvents = events;
    },

  },
  mounted() {
  const uid = localStorage.getItem("uid");

  this.calendarOptions.select = this.handleDateSelect;
  this.calendarOptions.eventClick = this.handleEventClick;
  this.calendarOptions.eventsSet = this.handleEvents;

  axios.get("http://localhost:5000/calendar")
    .then(res => {
      const events = res.data.map(e => ({
        id: e.calendar_id,
        title: e.title,
        start: e.datetime,
        allDay: true
      }));
      this.calendarOptions.events = events;
    })
    .catch(err => {
      console.error("載入行事曆失敗", err);
    });
  }
});
</script>

<template>
  <div class="calendar_container">
    <div class="demo-app">
      <div class="demo-app-main">
        <FullCalendar class="demo-app-calendar" :options="calendarOptions">
          <template v-slot:eventContent="arg">
            <b>{{ arg.timeText }}</b>
            <i>{{ arg.event.title }}</i>
          </template>
        </FullCalendar>
      </div>
      <div class="demo-app-sidebar">
        <h2>All Events ({{ currentEvents.length }})</h2>
        <ul>
          <li v-for="event in currentEvents" :key="event.id">
            <b>{{ event.startStr }}</b>
            <i>{{ event.title }}</i>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

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
  /* used for event dates/times */
  margin-right: 3px;
}
.calendar_container{
    display: flex;
    justify-content: flex-end;
    padding: 10px 20px 10px 0px ;
    height: 100%;
}
.demo-app {
  display: flex;
  width: 80%;
  font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
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
  /* the calendar root */
  max-width: 1100px;
  margin: 0 auto;
}
</style>
