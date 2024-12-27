// Initialize lists from local storage
let lists = JSON.parse(localStorage.getItem('lists')) || [
    {"name": "Todo", "entries": ["Buy Milk", "Walk the Dog", "Complete Project"]},
    {"name": "Shopping", "entries": ["Eggs", "Bread", "Buy Milk"]},
    {"name": "Work", "entries": ["Finish Report", "Email Client"]}
];

// Global variable to store all searched entries
let searchedEntries = [];

// Display lists and entries
function displayLists() {
    const listsDiv = document.getElementById('lists');
    const fragment = document.createDocumentFragment();
    lists.forEach((list, listIndex) => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list-container';
        listDiv.innerHTML = `<h3>${list.name} <i class="fas fa-pencil-alt icon-button" aria-label="Edit List Name" onclick="editListName(${listIndex})"></i> <i class="fas fa-trash-alt icon-button" aria-label="Delete List" onclick="deleteList(${listIndex})"></i> <i class="fas fa-plus icon-button" aria-label="Add Entries" onclick="toggleAddEntriesForm(${listIndex})"></i></h3>`;

        const addEntriesForm = document.createElement('form');
        addEntriesForm.className = 'add-entries-form';
        addEntriesForm.innerHTML = `<textarea placeholder="Enter entries, one per line" required></textarea> <button type="submit" class="icon-button" aria-label="Add Entries"><i class="fas fa-plus"></i> Add</button>`;

        addEntriesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newEntries = e.target.querySelector('textarea').value.split('\n').map(entry => entry.trim()).filter(entry => entry !== '');
            if (newEntries.length > 0) {
                list.entries = list.entries.concat(newEntries);
                localStorage.setItem('lists', JSON.stringify(lists));
                e.target.reset();
                e.target.style.display = 'none';
                displayLists();
                showMessage('Entries added successfully', 'success');
            } else {
                alert("Please fill in at least one entry.");
            }
        });

        const entriesContainer = document.createElement('div');
        list.entries.forEach((entry, entryIndex) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'list-entry';
            entryDiv.innerHTML = `${entry} <i class="fas fa-pencil-alt icon-button" aria-label="Edit Entry" onclick="editEntry(${listIndex}, ${entryIndex})"></i> <i class="fas fa-trash-alt icon-button" aria-label="Delete Entry" onclick="deleteEntry(${listIndex}, ${entryIndex})"></i>`;
            entriesContainer.appendChild(entryDiv);
        });

        listDiv.appendChild(entriesContainer);
        listDiv.appendChild(addEntriesForm);
        fragment.appendChild(listDiv);
    });
    listsDiv.innerHTML = '';
    listsDiv.appendChild(fragment);
}

// Toggle visibility of add entries form
function toggleAddEntriesForm(listIndex) {
    const forms = document.querySelectorAll('.add-entries-form');
    forms.forEach(form => form.style.display = 'none');
    const formToShow = forms[listIndex];
    formToShow.style.display = 'block';
}

// Real-time search functionality for multiple entries
document.getElementById('search').addEventListener('input', function() {
    const searchTerms = this.value.split('\n').map(term => term.trim().toLowerCase());
    searchedEntries = []; // Reset the searched entries array

    let filteredLists = lists.map((list, listIndex) => {
        return {
            name: list.name,
            listIndex: listIndex,
            entries: list.entries.map((entry, entryIndex) => ({ entry, listIndex, entryIndex }))
                .filter(entryObj => {
                    const entryLower = entryObj.entry.toLowerCase();
                    const matches = searchTerms.some(term => entryLower.includes(term));
                    if (matches) {
                        searchedEntries.push(entryObj.entry);
                    }
                    return matches;
                })
        };
    }).filter(list => list.entries.length > 0);

    displayFilteredLists(filteredLists, searchTerms);
});

function displayFilteredLists(filteredLists, searchTerms) {
    const listsDiv = document.getElementById('lists');
    listsDiv.innerHTML = '';
    filteredLists.forEach(list => {
        const listDiv = document.createElement('div');
        listDiv.className = 'list-container';
        listDiv.innerHTML = `<h3>${list.name} <input type="checkbox" class="select-all-checkbox" onclick="toggleSelectAll(this, ${list.listIndex})"> Select All</h3>`;

        const entriesContainer = document.createElement('div');
        list.entries.forEach(entryObj => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'list-entry';
            const highlightedEntry = highlightSearchTerms(entryObj.entry, searchTerms);
            entryDiv.innerHTML = `<input type="checkbox" class="entry-checkbox" data-list-index="${entryObj.listIndex}" data-entry-index="${entryObj.entryIndex}"> ${highlightedEntry} <i class="fas fa-pencil-alt icon-button" aria-label="Edit Entry" onclick="editEntry(${entryObj.listIndex}, ${entryObj.entryIndex})"></i> <i class="fas fa-trash-alt icon-button" aria-label="Delete Entry" onclick="deleteEntry(${entryObj.listIndex}, ${entryObj.entryIndex})"></i>`;
            entriesContainer.appendChild(entryDiv);
        });

        listDiv.appendChild(entriesContainer);
        listsDiv.appendChild(listDiv);
    });
}

// Function to highlight search terms within the list entries
function highlightSearchTerms(entry, searchTerms) {
    let highlightedEntry = entry;
    searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedEntry = highlightedEntry.replace(regex, '<span class="highlight">$1</span>');
    });
    return highlightedEntry;
}

// Function to toggle select all checkboxes within a list
function toggleSelectAll(checkbox, listIndex) {
    const entries = document.querySelectorAll(`.list-entry input[type="checkbox"][data-list-index="${listIndex}"]`);
    entries.forEach(entry => {
        entry.checked = checkbox.checked;
    });
}

// Function to copy all searched entries to clipboard
function copyAllSearchedEntries() {
    const entries = searchedEntries.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(entries).then(() => {
            showMessage('Copied all searched entries to clipboard!', 'success');
        }).catch(err => {
            showMessage('Failed to copy text: ' + err, 'error');
        });
    } else {
        // Fallback for browsers that don't support Clipboard API
        const tempInput = document.createElement('textarea');
        tempInput.value = entries;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        showMessage('Copied all searched entries to clipboard!', 'success');
    }
}

// Function to copy selected entries to clipboard
function copySelectedEntries() {
    const checkboxes = document.querySelectorAll('.list-entry input[type="checkbox"]:checked');
    const selectedEntries = Array.from(checkboxes).map(checkbox => {
        const listIndex = checkbox.getAttribute('data-list-index');
        const entryIndex = checkbox.getAttribute('data-entry-index');
        return lists[listIndex].entries[entryIndex];
    });
    const entries = selectedEntries.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(entries).then(() => {
            showMessage('Copied selected entries to clipboard!', 'success');
        }).catch(err => {
            showMessage('Failed to copy text: ' + err, 'error');
        });
    } else {
        // Fallback for browsers that don't support Clipboard API
        const tempInput = document.createElement('textarea');
        tempInput.value = entries;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);

        showMessage('Copied selected entries to clipboard!', 'success');
    }
}

// Create list
document.getElementById('create-list').addEventListener('submit', function(e) {
    e.preventDefault();
    const listName = document.getElementById('listName').value;
    const entriesText = document.getElementById('entries').value;
    const newEntries = entriesText.split('\n').map(entry => entry.trim()).filter(entry => entry !== '');

    if (listName && newEntries.length > 0) {
        lists.push({ name: listName, entries: newEntries });
        localStorage.setItem('lists', JSON.stringify(lists));
        this.reset();
        displayLists();
        showMessage('List created successfully', 'success');
    } else {
        alert("Please fill in both list name and at least one entry.");
    }
});

// Edit list name
function editListName(listIndex) {
    const newName = prompt("Enter new list name:", lists[listIndex].name);
    if (newName) {
        lists[listIndex].name = newName;
        localStorage.setItem('lists', JSON.stringify(lists));
        displayLists();
        showMessage('List name edited successfully', 'success');
    }
}

// Edit entry
function editEntry(listIndex, entryIndex) {
    const newEntry = prompt("Enter new entry:", lists[listIndex].entries[entryIndex]);
    if (newEntry) {
        lists[listIndex].entries[entryIndex] = newEntry;
        localStorage.setItem('lists', JSON.stringify(lists));
        displayLists();
        showMessage('Entry edited successfully', 'success');
    }
}

// Delete list
function deleteList(listIndex) {
    if (confirm("Are you sure you want to delete this list?")) {
        lists.splice(listIndex, 1);
        localStorage.setItem('lists', JSON.stringify(lists));
        displayLists();
        showMessage('List deleted successfully', 'success');
    }
}

// Delete entry
function deleteEntry(listIndex, entryIndex) {
    if (confirm("Are you sure you want to delete this entry?")) {
        lists[listIndex].entries.splice(entryIndex, 1);
        localStorage.setItem('lists', JSON.stringify(lists));
        displayLists();
        showMessage('Entry deleted successfully', 'success');
    }
}

// Global Copy All button
document.getElementById('global-copy-all-btn').addEventListener('click', copyAllSearchedEntries);

// Copy Selected Entries button
document.getElementById('copy-selected-btn').addEventListener('click', copySelectedEntries);

// Reset All button
document.getElementById('reset-all-btn').addEventListener('click', function() {
    if (confirm("Are you sure you want to reset all data? This action cannot be undone.")) {
        localStorage.removeItem('lists');
        lists = [];
        displayLists();
        showMessage('All data has been reset', 'success');
    }
});

// Function to show messages
function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerText = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// Initial display
displayLists();
