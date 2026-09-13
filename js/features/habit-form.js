import { h, clear } from '../utils/dom.js';
import { openModal } from '../components/modal.js';
import { toast } from '../components/toast.js';
import { iconEl, ICON_KEYS } from '../utils/icons.js';
import { WEEKDAY_NAMES } from '../utils/date.js';
import { addHabit, updateHabit } from '../store.js';

const timesLabel = (n) => (n === 1 ? 'once a day' : n === 2 ? 'twice a day' : `${n} times a day`);

export function openHabitForm(existing = null) {
  const draft = existing
    ? JSON.parse(JSON.stringify(existing))
    : { name: '', icon: 'check', timesPerDay: 1, reminders: [], schedule: { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] } };
  let addingReminder = false;
  let reminderTime = '08:00';

  const body = h('div', { class: 'form-body' });
  const { close } = openModal({
    title: existing ? 'edit habit' : 'new habit',
    subtitle: existing ? 'update this habit' : 'create a new habit to track',
    content: body
  });

  function redraw() {
    const prevName = body.querySelector('#hf-name');          // fix #4: restore focus/caret
    const hadFocus = prevName === document.activeElement;
    const caret = hadFocus ? prevName.selectionStart : 0;
    clear(body);

    // name
    const nameInput = h('input', {
      id: 'hf-name', type: 'text', placeholder: 'e.g., drink water, read books', value: draft.name,
      oninput: (e) => { draft.name = e.target.value; }
    });
    body.append(h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'habit name'), nameInput));

    // icon dropdown (popover lives inside .icon-field-wrap so dismiss.js respects it)
    const pop = h('div', { class: 'popover icon-grid', hidden: true },
      ...ICON_KEYS.map((k) => h('button', {
        type: 'button', class: 'icon-opt' + (k === draft.icon ? ' sel' : ''), 'aria-label': k,
        onclick: () => { draft.icon = k; pop.hidden = true; redraw(); }
      }, iconEl(k))));
    body.append(h('span', { class: 'form-label' }, 'icon'),
      h('div', { class: 'icon-field-wrap' },
        h('button', { type: 'button', class: 'icon-field', 'aria-haspopup': 'true',
          onclick: () => { pop.hidden = !pop.hidden; } },
          iconEl(draft.icon),
          h('span', { class: 'chev', html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' })),
        pop));

    // times per day — daily schedules only (fix #9)
    if (draft.schedule.type === 'daily') {
      const stepper = h('div', { class: 'stepper' },
        ...Array.from({ length: draft.timesPerDay }, () =>
          h('span', { class: 'step-circle', 'aria-hidden': 'true' },
            h('span', { html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>' }))),
        h('button', { type: 'button', class: 'step-add', 'aria-label': 'increase times per day',
          onclick: () => { if (draft.timesPerDay < 9) { draft.timesPerDay++; redraw(); } } }, '+'),
        draft.timesPerDay > 1
          ? h('button', { type: 'button', class: 'step-add', 'aria-label': 'decrease times per day',
              onclick: () => { draft.timesPerDay--; redraw(); } }, '−')
          : null);
      body.append(h('span', { class: 'form-label' }, 'times per day'), stepper,
        h('p', { class: 'stepper-label' }, timesLabel(draft.timesPerDay)));
    }

    // reminders (fix #10: inline time picker, no prompt(), no duplicates)
    body.append(h('div', { class: 'row-between' },
      h('span', { class: 'form-label' }, 'reminders'),
      h('button', { type: 'button', class: 'link-btn', onclick: () => { addingReminder = !addingReminder; redraw(); } },
        addingReminder ? 'cancel' : '+ add')));
    body.append(h('div', { class: 'rem-list' },
      draft.reminders.length
        ? draft.reminders.map((t, i) => h('span', { class: 'chip active' }, t,
            h('button', { type: 'button', 'aria-label': `remove reminder ${t}`,
              onclick: () => { draft.reminders.splice(i, 1); redraw(); } }, '×')))
        : h('div', { class: 'rem-empty' }, 'No reminders added')));
    if (addingReminder) {
      body.append(h('div', { class: 'time-row' },
        h('input', { type: 'time', value: reminderTime, 'aria-label': 'reminder time', oninput: (e) => { reminderTime = e.target.value; } }),
        h('button', { type: 'button', class: 'btn-ghost', onclick: () => {
            if (!/^\d{2}:\d{2}$/.test(reminderTime)) return toast('invalid time');
            if (draft.reminders.includes(reminderTime)) return toast('already added');
            draft.reminders.push(reminderTime); draft.reminders.sort();
            addingReminder = false; redraw();
          } }, 'set')));
    }

    // days / weekly goal
    body.append(h('span', { class: 'form-label' }, 'days'),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'schedule type' },
        h('button', { type: 'button', class: 'seg-btn' + (draft.schedule.type === 'daily' ? ' active' : ''),
          onclick: () => { draft.schedule = { type: 'daily', days: [0, 1, 2, 3, 4, 5, 6] }; redraw(); } }, 'daily'),
        h('button', { type: 'button', class: 'seg-btn' + (draft.schedule.type === 'weekly' ? ' active' : ''),
          onclick: () => { draft.schedule = { type: 'weekly', goal: 3 }; redraw(); } }, 'weekly goal')));

    if (draft.schedule.type === 'daily') {
      const days = draft.schedule.days;
      body.append(h('div', { class: 'chips' },
        h('button', { type: 'button', class: 'chip' + (days.length === 7 ? ' active' : ''), 'aria-pressed': days.length === 7,
          onclick: () => { draft.schedule.days = days.length === 7 ? [] : [0, 1, 2, 3, 4, 5, 6]; redraw(); } },
          (days.length === 7 ? '✓ ' : '') + 'all days'),
        ...WEEKDAY_NAMES.map((nm, i) => h('button', {
          type: 'button', class: 'chip' + (days.includes(i) ? ' active' : ''), 'aria-pressed': days.includes(i),
          onclick: () => {
            const at = days.indexOf(i);
            if (at >= 0) days.splice(at, 1); else days.push(i);
            days.sort(); redraw();
          }
        }, nm))));
    } else {
      const g = draft.schedule.goal;
      body.append(h('div', { class: 'stepper' },
          h('button', { type: 'button', class: 'step-add', 'aria-label': 'decrease weekly goal', onclick: () => { if (g > 1) { draft.schedule.goal--; redraw(); } } }, '−'),
          h('span', { class: 'goal-num' }, String(g)),
          h('button', { type: 'button', class: 'step-add', 'aria-label': 'increase weekly goal', onclick: () => { if (g < 7) { draft.schedule.goal++; redraw(); } } }, '+')),
        h('p', { class: 'stepper-label' }, 'times per week'));
    }

    body.append(
      h('p', { class: 'form-note' }, 'You can change reminders and days anytime.'),
      h('button', { type: 'button', class: 'btn-primary', onclick: () => {
          if (!draft.name.trim()) { toast('give your habit a name first'); const live = body.querySelector('#hf-name'); live?.focus(); return; }
          if (draft.schedule.type === 'daily' && !draft.schedule.days.length) { toast('pick at least one day'); return; }
          if (existing) updateHabit(existing.id, draft); else addHabit(draft);
          close();
        } }, existing ? 'save changes' : 'create habit'));

    if (hadFocus) { nameInput.focus(); try { nameInput.setSelectionRange(caret, caret); } catch (_) {} }
  }

  redraw();
  body.querySelector('#hf-name')?.focus();
}