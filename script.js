let notes = JSON.parse(localStorage.getItem('cozy_notes')) || [];
let activeNoteId = null;
let currentEditingTodos = [];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const notesListEl = document.getElementById('notes-list');
const weeklyCalendarEl = document.getElementById('weekly-calendar');
const editorContainer = document.getElementById('editor-container');
const viewerContainer = document.getElementById('viewer-container');
const titleInput = document.getElementById('note-title-input');
const bodyInput = document.getElementById('note-body-input');
const todoInput = document.getElementById('todo-input');
const todoListPreview = document.getElementById('todo-list-preview');

// Render Weekly Calendar Bar
function renderWeeklyCalendar() {
    weeklyCalendarEl.innerHTML = '';
    daysOfWeek.forEach(day => {
        const dayNote = notes.find(n => n.dayTag === day);
        const dayEl = document.createElement('div');
        
        dayEl.className = `p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between items-center text-center ${
            dayNote ? 'bg-[#f4effa] border-[#d4c2e2] shadow-sm' : 'bg-[#fcfbf9] border-[#f0eae1] hover:bg-[#f7f4ef]'
        }`;
        
        dayEl.onclick = () => selectDay(day);

        dayEl.innerHTML = `
            <span class="text-xs font-bold text-[#5a4870]">${day}</span>
            <span class="text-[10px] text-[#a095a8] mt-1">${dayNote ? '📖 Has Note' : '+ Add'}</span>
        `;
        weeklyCalendarEl.appendChild(dayEl);
    });
}

// Click a day on the calendar
function selectDay(day) {
    const existingNote = notes.find(n => n.dayTag === day);
    if (existingNote) {
        viewOrEditNote(existingNote.id);
    } else {
        activeNoteId = null;
        titleInput.value = `${day}'s Plan 🌸`;
        bodyInput.value = '';
        currentEditingTodos = [];
        renderTodoListEditor();
        showEditorView();
        editorContainer.dataset.dayTag = day;
    }
}

// Render the sidebar notes list
function renderNotesList() {
    notesListEl.innerHTML = '';
    if (notes.length === 0) {
        notesListEl.innerHTML = `<div class="text-center py-8 text-[#b0a7b8]"><p class="text-sm">No notes yet! 🌸</p></div>`;
        renderWeeklyCalendar();
        return;
    }

    notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    notes.forEach(note => {
        const noteEl = document.createElement('div');
        const isActive = note.id === activeNoteId;
        noteEl.className = `p-4 rounded-2xl border cursor-pointer transition-all ${
            isActive ? 'bg-[#f4effa] border-[#d4c2e2] shadow-sm' : 'bg-[#fcfbf9] border-[#f0eae1] hover:bg-[#f7f4ef]'
        }`;
        noteEl.onclick = () => viewOrEditNote(note.id);

        let badge = note.dayTag ? `<span class="bg-[#e4d8f0] text-[#5a4870] text-[10px] px-2 py-0.5 rounded-full font-semibold">${note.dayTag}</span>` : '';

        noteEl.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-[#5a4870] truncate w-3/4">${escapeHTML(note.title) || 'Untitled Note 💭'}</h3>
                <button onclick="event.stopPropagation(); deleteNote('${note.id}')" class="text-[#c4bccb] hover:text-[#ff7b7b] text-sm p-1 transition">✕</button>
            </div>
            <div class="flex justify-between items-center mt-2">
                <p class="text-xs text-[#a095a8]">${formatDate(note.createdAt)}</p>
                ${badge}
            </div>
        `;
        notesListEl.appendChild(noteEl);
    });
    renderWeeklyCalendar();
}

// Open editor for a brand new note
function openEditor() {
    activeNoteId = null;
    titleInput.value = '';
    bodyInput.value = '';
    currentEditingTodos = [];
    delete editorContainer.dataset.dayTag;
    renderTodoListEditor();
    showEditorView();
}

// View or edit an existing note
function viewOrEditNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    activeNoteId = note.id;
    titleInput.value = note.title;
    bodyInput.value = note.rawBody || note.body;
    currentEditingTodos = note.todos ? [...note.todos] : [];
    if (note.dayTag) {
        editorContainer.dataset.dayTag = note.dayTag;
    } else {
        delete editorContainer.dataset.dayTag;
    }
    renderTodoListEditor();
    showEditorView();
}

function showEditorView() {
    editorContainer.classList.remove('hidden');
    viewerContainer.classList.add('hidden');
    titleInput.focus();
    renderNotesList();
}

function cancelEdit() {
    activeNoteId = null;
    editorContainer.classList.add('hidden');
    viewerContainer.classList.remove('hidden');
    viewerContainer.innerHTML = `
        <div class="text-5xl mb-3">🍵</div>
        <p class="text-base font-medium text-[#b0a7b8]">Select a note or pick a day from the weekly calendar!</p>
    `;
    renderNotesList();
}

// To-Do Management within Editor
function addTodoItem() {
    const text = todoInput.value.trim();
    if (!text) return;
    currentEditingTodos.push({ id: Date.now().toString(), text, completed: false });
    todoInput.value = '';
    renderTodoListEditor();
}

function toggleTodoItem(todoId) {
    currentEditingTodos = currentEditingTodos.map(t => t.id === todoId ? { ...t, completed: !t.completed } : t);
    renderTodoListEditor();
}

function removeTodoItem(todoId) {
    currentEditingTodos = currentEditingTodos.filter(t => t.id !== todoId);
    renderTodoListEditor();
}

function renderTodoListEditor() {
    todoListPreview.innerHTML = '';
    if (currentEditingTodos.length === 0) {
        todoListPreview.innerHTML = `<li class="text-xs text-[#b0a7b8] italic">No tasks added yet.</li>`;
        return;
    }
    currentEditingTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-[#f0eae1]';
        li.innerHTML = `
            <label class="flex items-center gap-2 cursor-pointer text-xs truncate">
                <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodoItem('${todo.id}')" class="rounded accent-[#d4c2e2]">
                <span class="${todo.completed ? 'line-through text-[#b0a7b8]' : 'text-[#5c5552]'}">${escapeHTML(todo.text)}</span>
            </label>
            <button onclick="removeTodoItem('${todo.id}')" class="text-[#c4bccb] hover:text-[#ff7b7b] text-xs">✕</button>
        `;
        todoListPreview.appendChild(li);
    });
}

// Save note with Markdown and Todos
function saveNote() {
    const title = titleInput.value.trim();
    const rawBody = bodyInput.value.trim();
    const dayTag = editorContainer.dataset.dayTag || null;

    if (!title && !rawBody && currentEditingTodos.length === 0) {
        alert('Your note is empty! Write something cute first 💕');
        return;
    }

    const htmlBody = marked.parse(rawBody);

    if (activeNoteId) {
        notes = notes.map(note => {
            if (note.id === activeNoteId) {
                return { ...note, title, rawBody, body: htmlBody, todos: [...currentEditingTodos], dayTag: dayTag || note.dayTag };
            }
            return note;
        });
    } else {
        const newNote = {
            id: Date.now().toString(),
            title: title || 'Untitled Note 💭',
            rawBody: rawBody,
            body: htmlBody,
            todos: [...currentEditingTodos],
            dayTag: dayTag,
            createdAt: new Date().toISOString()
        };
        notes.push(newNote);
        activeNoteId = newNote.id;
    }

    saveToLocalStorage();
    renderNotesList();
    previewActiveNote();
}

// Preview active note
function previewActiveNote() {
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;

    editorContainer.classList.add('hidden');
    viewerContainer.classList.remove('hidden');

    let todosHtml = '';
    if (note.todos && note.todos.length > 0) {
        let items = note.todos.map(t => `
            <li class="flex items-center gap-2 text-sm py-1">
                <input type="checkbox" ${t.completed ? 'checked' : ''} disabled class="rounded accent-[#d4c2e2]">
                <span class="${t.completed ? 'line-through text-[#b0a7b8]' : 'text-[#5c5552]'}">${escapeHTML(t.text)}</span>
            </li>
        `).join('');

        todosHtml = `
            <div class="mb-4 bg-[#fcfbf9] p-4 rounded-2xl border border-[#f0eae1]">
                <h4 class="text-xs font-bold text-[#8a7b93] uppercase tracking-wider mb-2">📝 To-Do List</h4>
                <ul class="space-y-1">${items}</ul>
            </div>
        `;
    }

    let badge = note.dayTag ? `<span class="bg-[#e4d8f0] text-[#5a4870] text-xs px-3 py-1 rounded-full font-semibold">${note.dayTag}</span>` : '';

    viewerContainer.innerHTML = `
        <div class="flex justify-between items-center border-b border-[#f0eae1] pb-4 mb-4">
            <div>
                <div class="flex items-center gap-3 mb-1">
                    <h2 class="text-2xl font-bold text-[#5a4870]">${escapeHTML(note.title)}</h2>
                    ${badge}
                </div>
                <p class="text-xs text-[#a095a8]">Created on ${formatDate(note.createdAt)} 🌸</p>
            </div>
            <button onclick="viewOrEditNote('${note.id}')" class="px-4 py-2 bg-[#f4effa] hover:bg-[#e4d8f0] text-[#7a6096] rounded-full text-sm font-semibold transition">Edit ✨</button>
        </div>
        ${todosHtml}
        <div class="overflow-y-auto flex-grow prose max-w-none text-[#5c5552] pr-2">
            ${note.body}
        </div>
    `;
}

// Delete a note
function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveToLocalStorage();
    if (activeNoteId === id) {
        cancelEdit();
    } else {
        renderNotesList();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('cozy_notes', JSON.stringify(notes));
}

function formatDate(isoString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(isoString).toLocaleDateString(undefined, options);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Initial App Load
renderWeeklyCalendar();
renderNotesList();