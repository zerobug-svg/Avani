/* =========================================================
   AVANI - PRASANNA'S PERSONAL AI ASSISTANT
   FUNCTIONALITY ONLY
   DESIGN / HTML / CSS ARE NOT CHANGED
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const chatMessages =
    document.getElementById("chatMessages");
/* =========================================================
   CHAT HISTORY
========================================================= */

let chatHistory =
    JSON.parse(
        localStorage.getItem("avani_chat_history") || "[]"
    );


function saveChatHistory() {

    localStorage.setItem(
        "avani_chat_history",
        JSON.stringify(chatHistory)
    );

}


function saveUserChatMessage(text) {

    chatHistory.push({

        role: "user",

        text: text,

        time: new Date().toISOString()

    });

    saveChatHistory();

}


function saveAssistantChatMessage(text) {

    chatHistory.push({

        role: "assistant",

        text: text,

        time: new Date().toISOString()

    });

    saveChatHistory();

}


function clearChatHistory() {

    chatHistory = [];

    localStorage.removeItem(
        "avani_chat_history"
    );

}


function restoreChatHistory() {

    if (
        !chatMessages ||
        chatHistory.length === 0
    ) {

        return;

    }


    chatHistory.forEach(message => {

        if (
            message.role === "user"
        ) {

            addUserMessage(
                message.text,
                false
            );

        }

        else if (
            message.role === "assistant"
        ) {

            addAssistantMessage(
                message.text,
                false
            );

        }

    });


    scrollChat();

}

/* =========================================================
   LOCAL STORAGE
========================================================= */

let memories =
    JSON.parse(
        localStorage.getItem("avani_memories") || "[]"
    );

let tasks =
    JSON.parse(
        localStorage.getItem("avani_tasks") || "[]"
    );

let notes =
    JSON.parse(
        localStorage.getItem("avani_notes") || "[]"
    );
let avaniSelectedFile = null;

/* =========================================================
   CHAT
========================================================= */

async function sendMessage() {

    if (sendButton.disabled) {
        return;
    }

    const message =
        messageInput.value.trim();

    /*
       FILE INTELLIGENCE
       Allow Avani to send a message
       when a file is attached even if
       the text box is empty.
    */

    const hasAttachedFile =
        avaniSelectedFile !== null;

    if (
        !message &&
        !hasAttachedFile
    ) {
        return;
    }

    /*
       If a file is attached but the user
       didn't type a question, give Avani
       a simple instruction instead of
       sending an empty message.
    */

    const finalMessage =
        message ||
        "I have attached a file. Please analyze it and tell me what you can find in it.";

    const lowerMessage =
        finalMessage.toLowerCase();

    /* =====================================================
       MEMORY - SHOW
    ===================================================== */

    if (
        lowerMessage.includes("what do you remember") ||
        lowerMessage.includes("show my memories") ||
        lowerMessage.includes("what do you know about me")
    ) {

        addUserMessage(message);

        messageInput.value = "";

        if (memories.length === 0) {

            addAssistantMessage(
                "I don't have any saved memories yet, Prasanna."
            );

        } else {

            const memoryList =
                memories
                    .map(
                        (memory, index) =>
                            `${index + 1}. ${memory}`
                    )
                    .join("\n");

            addAssistantMessage(
                "🧠 Here's what I remember about you:\n\n" +
                memoryList
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       MEMORY - FORGET
    ===================================================== */

    if (
        lowerMessage.startsWith("forget that ") ||
        lowerMessage.startsWith("forget ")
    ) {

        const memoryToForget =
            message
                .replace(/^forget that /i, "")
                .replace(/^forget /i, "")
                .trim();

        addUserMessage(message);

        messageInput.value = "";

        if (!memoryToForget) {

            addAssistantMessage(
                "Tell me which memory you want me to forget."
            );

            messageInput.focus();

            return;
        }

        const originalLength =
            memories.length;

        memories =
            memories.filter(
                memory =>
                    !memory
                        .toLowerCase()
                        .includes(
                            memoryToForget.toLowerCase()
                        )
            );

        if (
            memories.length <
            originalLength
        ) {

            localStorage.setItem(
                "avani_memories",
                JSON.stringify(memories)
            );

            addAssistantMessage(
                "🗑️ I've forgotten that memory, Prasanna."
            );

        } else {

            addAssistantMessage(
                "I couldn't find a matching memory to forget."
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       MEMORY - AUTOMATIC SAVE
    ===================================================== */

    let memoryText = null;

    const rememberPatterns = [

        /^remember that\s+(.+)/i,

        /^remember\s+that\s+(.+)/i,

        /^please remember that\s+(.+)/i,

        /^don't forget that\s+(.+)/i,

        /^dont forget that\s+(.+)/i,

        /^please don't forget that\s+(.+)/i

    ];

    for (
        const pattern of rememberPatterns
    ) {

        const match =
            message.match(pattern);

        if (match) {

            memoryText =
                match[1].trim();

            break;
        }
    }


    if (memoryText) {

        addUserMessage(message);

        messageInput.value = "";

        const alreadyExists =
            memories.some(
                memory =>
                    memory.toLowerCase() ===
                    memoryText.toLowerCase()
            );

        if (alreadyExists) {

            addAssistantMessage(
                "🧠 I already remember that, Prasanna."
            );

        } else {

            memories.push(
                memoryText
            );

            localStorage.setItem(
                "avani_memories",
                JSON.stringify(memories)
            );

            addAssistantMessage(
                `🧠 Got it, Prasanna. I'll remember:\n\n"${memoryText}"`
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       NOTES - SHOW
    ===================================================== */

    if (
        lowerMessage === "show my notes" ||
        lowerMessage === "my notes" ||
        lowerMessage === "list my notes" ||
        lowerMessage.includes("what are my notes")
    ) {

        addUserMessage(message);

        messageInput.value = "";

        if (notes.length === 0) {

            addAssistantMessage(
                "📝 You don't have any saved notes yet, Prasanna."
            );

        } else {

            const noteList =
                notes
                    .map(
                        (note, index) =>
                            `${index + 1}. ${note.title}`
                    )
                    .join("\n");

            addAssistantMessage(
                "📝 Here are your saved notes:\n\n" +
                noteList +
                "\n\nOpen Notes from the sidebar to read them."
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       NOTES - SEARCH
    ===================================================== */

    if (
        lowerMessage.startsWith("search my notes for ") ||
        lowerMessage.startsWith("search notes for ")
    ) {

        const searchText =
            message
                .replace(/^search my notes for /i, "")
                .replace(/^search notes for /i, "")
                .trim();

        addUserMessage(message);

        messageInput.value = "";

        if (!searchText) {

            addAssistantMessage(
                "Tell me what you want me to search for, Prasanna."
            );

            messageInput.focus();

            return;
        }

        const matches =
            notes.filter(
                note =>
                    `${note.title} ${note.content}`
                        .toLowerCase()
                        .includes(
                            searchText.toLowerCase()
                        )
            );

        if (matches.length === 0) {

            addAssistantMessage(
                `🔎 I couldn't find any note matching "${searchText}".`
            );

        } else {

            const results =
                matches
                    .map(
                        note =>
                            `📌 ${note.title}\n${note.content}`
                    )
                    .join("\n\n");

            addAssistantMessage(
                "🔎 I found these notes:\n\n" +
                results
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       NOTES - DELETE
    ===================================================== */

    if (
        lowerMessage.startsWith("delete my note ") ||
        lowerMessage.startsWith("delete note ") ||
        lowerMessage.startsWith("remove my note ") ||
        lowerMessage.startsWith("remove note ")
    ) {

        const noteToDelete =
            message
                .replace(/^delete my note /i, "")
                .replace(/^delete note /i, "")
                .replace(/^remove my note /i, "")
                .replace(/^remove note /i, "")
                .trim();

        addUserMessage(message);

        messageInput.value = "";

        const noteIndex =
            notes.findIndex(
                note =>
                    note.title
                        .toLowerCase()
                        .includes(
                            noteToDelete.toLowerCase()
                        )
            );

        if (noteIndex !== -1) {

            const deletedTitle =
                notes[noteIndex].title;

            notes.splice(
                noteIndex,
                1
            );

            localStorage.setItem(
                "avani_notes",
                JSON.stringify(notes)
            );

            addAssistantMessage(
                `🗑️ Note deleted:\n\n"${deletedTitle}"`
            );

        } else {

            addAssistantMessage(
                "I couldn't find a matching note, Prasanna."
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       NOTES - CREATE FROM CHAT
    ===================================================== */

    let noteCommand = null;

    const notePatterns = [

        /^save note[:\-]?\s*(.+)$/i,

        /^add note[:\-]?\s*(.+)$/i,

        /^create note[:\-]?\s*(.+)$/i,

        /^new note[:\-]?\s*(.+)$/i,

        /^save this as a note[:\-]?\s*(.+)$/i,

        /^save this[:\-]?\s*(.+)$/i

    ];

    for (
        const pattern of notePatterns
    ) {

        const match =
            message.match(pattern);

        if (match) {

            noteCommand =
                match[1].trim();

            break;
        }
    }


    if (noteCommand) {

        addUserMessage(message);

        messageInput.value = "";

        let title =
            "Quick Note";

        let content =
            noteCommand;


        /* ---------------------------------------------
           Support:
           save note: Python | Learn decorators
        --------------------------------------------- */

        if (
            noteCommand.includes("|")
        ) {

            const parts =
                noteCommand.split("|");

            title =
                parts.shift().trim();

            content =
                parts.join("|").trim();

            if (!title) {
                title = "Quick Note";
            }
        }


        /* ---------------------------------------------
           Support:
           save note "Python"
           content...
        --------------------------------------------- */

        const quotedTitle =
            content.match(
                /^["']([^"']+)["']\s*[:\-]\s*(.+)$/s
            );

        if (quotedTitle) {

            title =
                quotedTitle[1].trim();

            content =
                quotedTitle[2].trim();
        }


        if (!content) {

            addAssistantMessage(
                "I need some content to save in the note."
            );

            messageInput.focus();

            return;
        }


        const duplicate =
            notes.some(
                note =>
                    note.title.toLowerCase() ===
                        title.toLowerCase() &&
                    note.content.toLowerCase() ===
                        content.toLowerCase()
            );


        if (duplicate) {

            addAssistantMessage(
                "📝 I already have that note, Prasanna."
            );

        } else {

            notes.push({

                title:
                    title,

                content:
                    content,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            });

            localStorage.setItem(
                "avani_notes",
                JSON.stringify(notes)
            );

            addAssistantMessage(
                `📝 Note saved successfully.\n\nTitle: ${title}`
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       TASKS - SHOW
    ===================================================== */

    if (
        lowerMessage.includes("show my tasks") ||
        lowerMessage.includes("what are my tasks") ||
        lowerMessage.includes("list my tasks") ||
        lowerMessage === "my tasks"
    ) {

        addUserMessage(message);

        messageInput.value = "";

        if (tasks.length === 0) {

            addAssistantMessage(
                "📝 You don't have any tasks yet, Prasanna."
            );

        } else {

            const taskList =
                tasks
                    .map(
                        (task, index) => {

                            const status =
                                task.completed
                                    ? "✅"
                                    : "⬜";

                            return (
                                `${status} ${index + 1}. ${task.text}`
                            );
                        }
                    )
                    .join("\n");

            addAssistantMessage(
                "📝 Here are your tasks:\n\n" +
                taskList
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       TASKS - DELETE
    ===================================================== */

    if (
        lowerMessage.startsWith("delete my task ") ||
        lowerMessage.startsWith("delete task ") ||
        lowerMessage.startsWith("remove my task ") ||
        lowerMessage.startsWith("remove task ")
    ) {

        const taskToDelete =
            message
                .replace(/^delete my task /i, "")
                .replace(/^delete task /i, "")
                .replace(/^remove my task /i, "")
                .replace(/^remove task /i, "")
                .trim();

        addUserMessage(message);

        messageInput.value = "";

        const taskIndex =
            tasks.findIndex(
                task =>
                    task.text
                        .toLowerCase()
                        .includes(
                            taskToDelete.toLowerCase()
                        )
            );

        if (taskIndex !== -1) {

            const deletedTask =
                tasks[taskIndex].text;

            tasks.splice(
                taskIndex,
                1
            );

            saveTasks();

            addAssistantMessage(
                `🗑️ Task deleted:\n\n"${deletedTask}"`
            );

        } else {

            addAssistantMessage(
                "I couldn't find a matching task, Prasanna."
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       TASKS - COMPLETE
    ===================================================== */

    if (
        lowerMessage.startsWith("complete my task ") ||
        lowerMessage.startsWith("complete task ") ||
        lowerMessage.startsWith("finish my task ") ||
        lowerMessage.startsWith("finish task ") ||
        lowerMessage.startsWith("mark my task ")
    ) {

        let taskToComplete =
            message
                .replace(/^complete my task /i, "")
                .replace(/^complete task /i, "")
                .replace(/^finish my task /i, "")
                .replace(/^finish task /i, "")
                .replace(/^mark my task /i, "")
                .trim();

        taskToComplete =
            taskToComplete
                .replace(
                    /\s+as\s+complete$/i,
                    ""
                )
                .trim();

        addUserMessage(message);

        messageInput.value = "";

        const taskIndex =
            tasks.findIndex(
                task =>
                    task.text
                        .toLowerCase()
                        .includes(
                            taskToComplete.toLowerCase()
                        )
            );

        if (taskIndex !== -1) {

            tasks[taskIndex].completed =
                true;

            saveTasks();

            addAssistantMessage(
                `✅ Task completed:\n\n"${tasks[taskIndex].text}"`
            );

        } else {

            addAssistantMessage(
                "I couldn't find a matching task, Prasanna."
            );
        }

        messageInput.focus();

        return;
    }


    /* =====================================================
       TASKS - AUTOMATIC CREATION
    ===================================================== */

    let taskText = null;

    const taskPatterns = [

        /^add a task to\s+(.+)/i,

        /^add task to\s+(.+)/i,

        /^create a task to\s+(.+)/i,

        /^create task to\s+(.+)/i,

        /^make a task to\s+(.+)/i,

        /^make task to\s+(.+)/i,

        /^remind me to\s+(.+)/i,

        /^i need to\s+(.+)/i,

        /^i have to\s+(.+)/i,

        /^i should\s+(.+)/i,

        /^todo:\s*(.+)/i,

        /^to-do:\s*(.+)/i

    ];

    for (
        const pattern of taskPatterns
    ) {

        const match =
            message.match(pattern);

        if (match) {

            taskText =
                match[1].trim();

            break;
        }
    }


    if (taskText) {

        addUserMessage(message);

        messageInput.value = "";

        const alreadyExists =
            tasks.some(
                task =>
                    task.text.toLowerCase() ===
                    taskText.toLowerCase()
            );

        if (alreadyExists) {

            addAssistantMessage(
                "📝 I already have that task, Prasanna."
            );

        } else {

            tasks.push({

                text:
                    taskText,

                completed:
                    false,

                createdAt:
                    new Date().toISOString()

            });

            saveTasks();

            addAssistantMessage(
                `📝 Task added successfully:\n\n"${taskText}"`
            );
        }

        messageInput.focus();

        return;
    }


   /* =====================================================
   WEB SEARCH
===================================================== */

const webSearchPatterns = [
    /^search the web for\s+(.+)/i,
    /^search web for\s+(.+)/i,
    /^web search\s+(.+)/i,
    /^search online for\s+(.+)/i,
    /^look up\s+(.+)/i,
    /^find online\s+(.+)/i
];

let webSearchQuery = null;

for (const pattern of webSearchPatterns) {

    const match =
        finalMessage.match(pattern);

    if (match) {

        webSearchQuery =
            match[1].trim();

        break;
    }
}


if (webSearchQuery) {

    addUserMessage(message);

    messageInput.value = "";

    sendButton.disabled = true;

    showThinking();

    try {

        const response =
            await fetch(
                "/web-search",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message:
                            webSearchQuery
                    })
                }
            );


        const data =
            await response.json();


        removeThinking();


        if (data.success) {

            addAssistantMessage(
                data.response
            );


            if (
                data.sources &&
                data.sources.length
            ) {

                let sourcesText =
                    "\n\nSources:\n";


                data.sources.forEach(
                    (source, index) => {

                        sourcesText +=
                            `${index + 1}. ` +
                            `${source.title}\n` +
                            `${source.url}\n\n`;

                    }
                );


                addAssistantMessage(
                    sourcesText
                );
            }

        } else {

            addAssistantMessage(
                data.response ||
                "Web search could not be completed."
            );
        }


    } catch (error) {

        console.error(
            "WEB SEARCH ERROR:",
            error
        );


        removeThinking();


        addAssistantMessage(
            "I couldn't connect to the web search service."
        );

    } finally {

        sendButton.disabled =
            false;

        messageInput.focus();
    }


    return;
}
/* =====================================================
   AGENT ACTIONS
===================================================== */

const agentPatterns = [
    /^open .+/i,
    /^go to .+/i,
    /^calculate .+/i,
    /^what is .+/i,

    /^increase volume$/i,
    /^turn up volume$/i,
    /^volume up$/i,
    /^make volume louder$/i,
    /^make it louder$/i,
    /^louder$/i,

    /^decrease volume$/i,
    /^turn down volume$/i,
    /^volume down$/i,
    /^lower the volume$/i,
    /^make volume quieter$/i,
    /^make it quieter$/i,
    /^quieter$/i,

    /^mute$/i,
    /^mute volume$/i,
    /^mute my laptop$/i,

    /^unmute$/i,
    /^unmute volume$/i,
    /^unmute my laptop$/i
];
const isAgentCommand =
    agentPatterns.some(pattern =>
        pattern.test(finalMessage.trim())
    );

if (isAgentCommand) {

    addUserMessage(message);

    messageInput.value = "";

    sendButton.disabled = true;

    showThinking();

    try {

        const response =
            await fetch(
                "/agent",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        command: finalMessage
                    })
                }
            );


        if (!response.ok) {

            throw new Error(
                "Agent backend connection failed"
            );

        }


        const data =
            await response.json();


        removeThinking();


        if (
            data.success &&
            data.action === "open_website" &&
            data.url
        ) {

            addAssistantMessage(
                data.response
            );

            window.open(
                data.url,
                "_blank"
            );

        }

        else {

            addAssistantMessage(
                data.response ||
                "Agent action completed."
            );

        }


    } catch (error) {

        removeThinking();

        addAssistantMessage(
            "I couldn't complete that agent action right now."
        );

        console.error(
            "AGENT ERROR:",
            error
        );

    }


    sendButton.disabled = false;

    messageInput.focus();

    return;
}

/* =====================================================
   NORMAL AI CHAT
===================================================== */

addUserMessage(message);

messageInput.value = "";

sendButton.disabled = true;

showThinking();


    /* =====================================================
       MEMORY CONTEXT
    ===================================================== */

    let memoryContext = "";

    if (
        memories.length > 0
    ) {

        memoryContext =
            "\n\nIMPORTANT USER MEMORY:\n" +

            memories
                .map(
                    (memory, index) =>
                        `${index + 1}. ${memory}`
                )
                .join("\n") +

            "\n\n" +

            "Use these memories when they are relevant " +
            "to the user's current request. " +

            "Do not mention the memory system unless " +
            "the user asks about it.\n";
    }


    /* =====================================================
       TASK CONTEXT
    ===================================================== */

    let taskContext = "";

    const incompleteTasks =
        tasks.filter(
            task =>
                !task.completed
        );

    if (
        incompleteTasks.length > 0
    ) {

        taskContext =
            "\n\nCURRENT USER TASKS:\n" +

            incompleteTasks
                .map(
                    (task, index) =>
                        `${index + 1}. ${task.text}`
                )
                .join("\n") +

            "\n\n" +

            "Use the user's tasks when relevant. " +
            "Do not mention this task context unless " +
            "it is useful for the current request.\n";
    }


    /* =====================================================
       NOTES CONTEXT
    ===================================================== */

    let noteContext = "";

    if (
        notes.length > 0
    ) {

        noteContext =
            "\n\nUSER'S SAVED NOTES:\n" +

            notes
                .slice(-10)
                .map(
                    note =>
                        `Title: ${note.title}\nContent: ${note.content}`
                )
                .join("\n\n") +

            "\n\n" +

            "Use these notes only when relevant " +
            "to the user's current request. " +
            "Do not mention the notes context unless useful.\n";
    }


    /* =====================================================
       MESSAGE SENT TO AVANI
    ===================================================== */

    const messageForAvani =
        memoryContext +

        taskContext +

        noteContext +

        "\nUSER MESSAGE:\n" +

        message;


    try {

    let response;

    /*
       =====================================================
       FILE INTELLIGENCE
       =====================================================
    */

    if (
        hasAttachedFile &&
        avaniSelectedFile &&
        avaniSelectedFile.filePath
    ) {

        const fileChatMessage =
            memoryContext +
            taskContext +
            noteContext +
            "\nUSER MESSAGE:\n" +
            finalMessage;

        response =
            await fetch(
                "/chat-with-file",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message:
                            fileChatMessage,

                        file_path:
                            avaniSelectedFile.filePath

                    })
                }
            );

    }

    /*
       =====================================================
       NORMAL CHAT
       =====================================================
    */

    else {

        response =
            await fetch(
                `/chat?message=${encodeURIComponent(messageForAvani)}`
            );
    }


    /*
       =====================================================
       CHECK RESPONSE
       =====================================================
    */

    if (!response.ok) {

        throw new Error(
            "Backend connection failed"
        );
    }


    const data =
        await response.json();


    removeThinking();


    addAssistantMessage(
        data.response
    );
clearAvaniAttachedFile();
}
    catch (error) {

        removeThinking();

        addAssistantMessage(

            "I'm sorry, Prasanna. " +

            "I can't connect to my local AI system right now. " +

            "Please make sure Ollama and FastAPI are running."

        );

        console.error(error);
    }

    sendButton.disabled =
        false;

    messageInput.focus();
}


/* =========================================================
   USER MESSAGE + CHAT HISTORY
========================================================= */

function addUserMessage(text, saveToHistory = true) {

    const row =
        document.createElement("div");

    row.className =
        "chat-row user";

    row.innerHTML = `

        <div class="bubble">
            ${escapeHtml(text)}
        </div>

        <div class="small-avatar prasanna-avatar">

            <img
                src="/static/assets/prasanna.png"
                alt="Prasanna"
            >

        </div>

        <span class="time">
            Now
        </span>

    `;

    chatMessages.appendChild(row);

    if (saveToHistory) {

        saveUserChatMessage(text);

    }

    scrollChat();
}


/* =========================================================
   AVANI MESSAGE + CHAT HISTORY
========================================================= */

function addAssistantMessage(text, saveToHistory = true) {

    const row =
        document.createElement("div");

    row.className =
        "chat-row";

    row.innerHTML = `

        <div class="small-avatar">

            <img
                src="/static/assets/avani-girl.png"
                alt="Avani"
            >

        </div>

        <div class="bubble assistant">
            ${formatResponse(text)}
        </div>

        <span class="time">
            Now
        </span>

    `;

    chatMessages.appendChild(row);

    if (saveToHistory) {

        saveAssistantChatMessage(text);

    }

    scrollChat();
}



/* =========================================================
   THINKING
========================================================= */

function showThinking() {

    const row =
        document.createElement("div");

    row.id =
        "thinking";

    row.className =
        "chat-row";

    row.innerHTML = `

        <div class="small-avatar">

            <img
                src="/static/assets/avani-girl.png"
                alt="Avani"
            >

        </div>

        <div class="bubble assistant">
            Avani is thinking...
        </div>

    `;

    chatMessages.appendChild(row);

    scrollChat();
}


function removeThinking() {

    const thinking =
        document.getElementById(
            "thinking"
        );

    if (thinking) {

        thinking.remove();

    }
}


/* =========================================================
   SAVE HELPERS
========================================================= */

function saveTasks() {

    localStorage.setItem(
        "avani_tasks",
        JSON.stringify(tasks)
    );
}


function saveNotes() {

    localStorage.setItem(
        "avani_notes",
        JSON.stringify(notes)
    );
}


/* =========================================================
   SUGGESTIONS
========================================================= */

document
    .querySelectorAll(
        ".suggestions button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                messageInput.value =
                    button.textContent.trim();

                messageInput.focus();

            }
        );

    });


/* =========================================================
   HERO QUICK ACTIONS
========================================================= */

document
    .querySelectorAll(
        ".quick-actions button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const action =
                    button.textContent
                        .trim()
                        .toLowerCase();

                let message;

                if (
                    action.includes("chat")
                ) {

                    message =
                        "Avani, let's chat.";

                }

                else if (
                    action.includes("remember")
                ) {

                    message =
                        "Avani, what do you remember about me?";

                }

                else if (
                    action.includes("plan")
                ) {

                    message =
                        "Avani, help me plan my day.";

                }

                else if (
                    action.includes("learn")
                ) {

                    message =
                        "Avani, help me learn something useful.";

                }

                else {

                    message =
                        "Avani, what can you help me with?";

                }

                messageInput.value =
                    message;

                messageInput.focus();

            }
        );

    });


/* =========================================================
   ENTER KEY
========================================================= */

messageInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


/* =========================================================
   SEND BUTTON
========================================================= */

sendButton.addEventListener(
    "click",
    sendMessage
);


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".nav-item"
                    )
                    .forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });

                button.classList.add(
                    "active"
                );

                const page =
                    button.dataset.page ||

                    button
                        .querySelector(
                            ".nav-label"
                        )
                        ?.textContent
                        .trim()
                        .toLowerCase();

                handleSidebarPage(
                    page
                );

            }
        );

    });


/* =========================================================
   SIDEBAR HANDLER
========================================================= */

function handleSidebarPage(page) {

   if (page === "chat") {

    openChatHistoryPanel();

    return;

}

    if (page === "memory") {

        openMemoryPanel();

        return;
    }

    if (page === "tasks") {

        openTasksPanel();

        return;
    }

    if (page === "notes") {

        openNotesPanel();

        return;
    }

    if (page === "learning hub") {

        openLearningPanel();

        return;
    }

    if (page === "tools") {

        openToolsPanel();

        return;
    }

    if (page === "settings") {

        openSettingsPanel();

        return;
    }
}


/* =========================================================
   BRAND CLICK
   LEFT "PRASANNA AI SOLUTIONS"
========================================================= */

const brandButton =
    document.getElementById(
        "brandButton"
    );

if (brandButton) {

    brandButton.addEventListener(
        "click",
        openPrasannaBrandProfile
    );

    brandButton.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openPrasannaBrandProfile();

            }

        }
    );

}


/* =========================================================
   PRASANNA PROFILE
========================================================= */

const prasannaProfile =
    document.getElementById(
        "prasannaProfile"
    );

if (prasannaProfile) {

    prasannaProfile.addEventListener(
        "click",
        openPrasannaInfo
    );
}
/* =========================================================
   PRASANNA AI SOLUTIONS
   LEFT BRAND PROFILE
========================================================= */

function openPrasannaBrandProfile() {

    closePanel();

    closePrasannaModal();

    const modal =
        document.createElement("div");

    modal.id =
        "prasannaBrandProfileModal";

    modal.className =
        "prasanna-brand-profile-modal";

    modal.innerHTML = `

        <div
            class="prasanna-brand-profile-backdrop"
            onclick="closePrasannaBrandProfile()"
        ></div>


        <div class="prasanna-brand-profile-card">


            <!-- CLOSE -->

            <button
                class="prasanna-brand-profile-close"
                onclick="closePrasannaBrandProfile()"
                title="Close"
                aria-label="Close"
            >
                ×
            </button>


            <!-- BRIGHT BRAND HEADER -->

            <div class="prasanna-brand-profile-header">

                <div class="prasanna-brand-profile-logo">
                    A
                </div>

                <div>

                    <div class="prasanna-brand-profile-title">
                        Prasanna AI Solutions
                    </div>

                    <div class="prasanna-brand-profile-tagline">
                        Ideas Today. Smarter Tomorrow.
                    </div>

                </div>

            </div>


            <!-- PROFILE IMAGE -->

            <div class="prasanna-brand-profile-image">

                <img
                    src="/static/assets/prasanna.png"
                    alt="Prasanna Dattu Adhav"
                >

            </div>


            <!-- NAME -->

            <h1>
                Prasanna Dattu Adhav
            </h1>


            <!-- ROLE -->

            <div class="prasanna-brand-profile-role">
                AI/ML Engineer at Cognizant
            </div>


            <!-- ABOUT -->

            <section class="prasanna-brand-section">

                <h2>
                    About Me
                </h2>

                <p>
                    I am Prasanna Dattu Adhav, an AI/ML Engineer
                    passionate about Artificial Intelligence,
                    Machine Learning and building practical
                    technology solutions.
                </p>

                <p>
                    I enjoy creating intelligent applications,
                    exploring modern AI technologies and
                    transforming ideas into useful real-world
                    products.
                </p>

            </section>


            <!-- SKILLS -->

            <section class="prasanna-brand-section">

                <h2>
                    Skills
                </h2>

                <div class="prasanna-brand-skills">

                    <span>Python</span>
                    <span>Machine Learning</span>
                    <span>Artificial Intelligence</span>
                    <span>Generative AI</span>
                    <span>LLMs</span>
                    <span>NLP</span>
                    <span>FastAPI</span>
                    <span>Ollama</span>
                    <span>MLOps</span>
                    <span>Docker</span>
                    <span>REST APIs</span>
                    <span>Data Analysis</span>

                </div>

            </section>


            <!-- PROJECTS -->

            <section class="prasanna-brand-section">

                <h2>
                    Projects
                </h2>


                <div class="prasanna-brand-project">

                    <h3>
                        Avani — Personal AI Assistant
                    </h3>

                    <p>
                        A personal AI assistant built using
                        Python, FastAPI and Ollama with
                        memory, tasks, notes, voice assistance,
                        file intelligence, image intelligence
                        and web search.
                    </p>

                </div>


                <div class="prasanna-brand-project">

                    <h3>
                        Spam Classification System
                    </h3>

                    <p>
                        A Machine Learning application designed
                        to identify spam messages using
                        text processing and classification
                        techniques.
                    </p>

                </div>


                <div class="prasanna-brand-project">

                    <h3>
                        AI/ML Projects & Experiments
                    </h3>

                    <p>
                        Exploring Artificial Intelligence,
                        Machine Learning, Generative AI,
                        automation and practical intelligent
                        applications.
                    </p>

                </div>

            </section>


            <!-- EDUCATION -->

            <section class="prasanna-brand-section">

                <h2>
                    Education
                </h2>

                <div class="prasanna-brand-education">

                    <h3>
                        Pune District Education Association's
                        College of Engineering
                    </h3>

                    <p>
                        Hadapsar, Pune
                    </p>

                    <strong>
                        Bachelor's Degree in Information Technology
                    </strong>

                    <p>
                        Savitribai Phule Pune University
                    </p>

                </div>

            </section>


            <!-- CERTIFICATIONS / ACHIEVEMENTS -->

            <section class="prasanna-brand-section">

                <h2>
                    Certificates & Achievements
                </h2>

                <div class="prasanna-brand-placeholder">

                    <div>
                        🎓
                    </div>

                    <p>
                        Professional certificates, training
                        credentials and achievements can be
                        added here.
                    </p>

                </div>

            </section>


            <!-- CONTACT -->

            <section class="prasanna-brand-section">

                <h2>
                    Contact
                </h2>

                <div class="prasanna-brand-contact">


                    <a
                        href="tel:7020326695"
                    >

                        <span>☎</span>

                        <div>
                            <small>Phone</small>
                            7020326695
                        </div>

                    </a>


                    <a
                        href="mailto:adhavprasanna@gmail.com"
                    >

                        <span>✉</span>

                        <div>
                            <small>Email</small>
                            adhavprasanna@gmail.com
                        </div>

                    </a>


                    <a
                        href="https://www.instagram.com/prasanna_045_ig/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >

                        <span>◎</span>

                        <div>
                            <small>Instagram</small>
                            @prasanna_045_ig
                        </div>

                    </a>


                </div>

            </section>


            <!-- FOOTER -->

            <div class="prasanna-brand-profile-footer">

                <strong>
                    Prasanna AI Solutions
                </strong>

                <span>
                    AI • Machine Learning • Innovation
                </span>

            </div>


        </div>

    `;


    document.body.appendChild(
        modal
    );


    setTimeout(
        () => {

            modal.classList.add(
                "show"
            );

        },
        10
    );

}


/* =========================================================
   CLOSE LEFT BRAND PROFILE
========================================================= */

function closePrasannaBrandProfile() {

    const modal =
        document.getElementById(
            "prasannaBrandProfileModal"
        );

    if (modal) {

        modal.remove();

    }

}

/* =========================================================
   PRASANNA INFORMATION
========================================================= */

function openPrasannaInfo() {

    closePanel();

    closePrasannaModal();

    const modal =
        document.createElement("div");

    modal.id =
        "prasannaInfoModal";

    modal.className =
        "prasanna-modal";

    modal.innerHTML = `

        <div
            class="prasanna-modal-backdrop"
            onclick="closePrasannaModal()"
        ></div>

        <div class="prasanna-info-card">

            <button
                class="prasanna-modal-close"
                onclick="closePrasannaModal()"
            >
                ×
            </button>

            <div class="prasanna-info-avatar">

                <img
                    src="/static/assets/prasanna.png"
                    alt="Prasanna"
                >

            </div>

            <h2>
                Prasanna Adhav
            </h2>

            <p class="prasanna-role">
                AI / ML Engineer
            </p>

            <div class="prasanna-divider"></div>

            <div class="prasanna-contact">

                <a
                    href="mailto:adhavprasanna@gmail.com"
                    class="prasanna-contact-item"
                >

                    <span class="contact-icon">
                        ✉
                    </span>

                    <span>

                        <small>
                            Email
                        </small>

                        adhavprasanna@gmail.com

                    </span>

                </a>

                <a
                    href="https://www.instagram.com/prasanna_045_ig/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="prasanna-contact-item"
                >

                    <span class="contact-icon">
                        ◎
                    </span>

                    <span>

                        <small>
                            Instagram
                        </small>

                        @prasanna_045_ig

                    </span>

                </a>

            </div>

            <div class="prasanna-about">

                Building ideas with
                Artificial Intelligence,
                Machine Learning and technology.

            </div>

        </div>

    `;

    document.body.appendChild(
        modal
    );

    setTimeout(
        () => {

            modal.classList.add(
                "show"
            );

        },
        10
    );
}


/* =========================================================
   LARGE PRASANNA IMAGE
========================================================= */

function openPrasannaImage() {

    closePanel();

    closePrasannaModal();

    const modal =
        document.createElement("div");

    modal.id =
        "prasannaImageModal";

    modal.className =
        "prasanna-image-modal";

    modal.innerHTML = `

        <div
            class="prasanna-image-backdrop"
            onclick="closePrasannaModal()"
        ></div>

        <div class="prasanna-image-card">

            <button
                class="prasanna-image-close"
                onclick="closePrasannaModal()"
            >
                ×
            </button>

            <div class="prasanna-image-frame">

                <img
                    src="/static/assets/prasanna.png"
                    alt="Prasanna"
                >

            </div>

            <h3>
                Prasanna
            </h3>

            <p>
                Prasanna AI Solutions
            </p>

        </div>

    `;

    document.body.appendChild(
        modal
    );

    setTimeout(
        () => {

            modal.classList.add(
                "show"
            );

        },
        10
    );
}


/* =========================================================
   CLOSE PRASANNA MODAL
========================================================= */

function closePrasannaModal() {

    const infoModal =
        document.getElementById(
            "prasannaInfoModal"
        );

    const imageModal =
        document.getElementById(
            "prasannaImageModal"
        );

    if (infoModal) {

        infoModal.remove();

    }

    if (imageModal) {

        imageModal.remove();

    }
}


/* =========================================================
   PANEL CREATOR
========================================================= */

function createPanel(
    title,
    content
) {

    closePrasannaModal();

    closePanel();

    const overlay =
        document.createElement("div");

    overlay.id =
        "avaniPanelOverlay";

    overlay.className =
        "avani-panel-overlay";

    overlay.innerHTML = `

        <div class="avani-panel">

            <button
                class="panel-close"
                onclick="closePanel()"
            >
                ×
            </button>

            <h2>
                ${title}
            </h2>

            <div class="panel-content">

                ${content}

            </div>

        </div>

    `;

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target === overlay
            ) {

                closePanel();

            }

        }
    );

    document.body.appendChild(
        overlay
    );
}


function closePanel() {

    const panel =
        document.getElementById(
            "avaniPanelOverlay"
        );

    if (panel) {

        panel.remove();

    }
}

/* =========================================================
   CHAT HISTORY PANEL
========================================================= */

function openChatHistoryPanel() {

    let content = `

        <div class="chat-history-panel">

            <div class="chat-history-title">

                <div>
                    <h3>Chat History</h3>

                    <p>
                        Your conversations with Avani
                    </p>
                </div>

                <button
                    class="history-clear-button"
                    onclick="deleteChatHistory()"
                    title="Delete Chat History"
                >
                    🗑️
                </button>

            </div>

    `;


    if (
        !chatHistory ||
        chatHistory.length === 0
    ) {

        content += `

            <div class="chat-history-empty">

                <div class="chat-history-empty-icon">
                    💬
                </div>

                <h3>
                    No conversations yet
                </h3>

                <p>
                    Start chatting with Avani and your conversations will appear here.
                </p>

            </div>

        `;

    }

    else {

        content += `

            <div class="chat-history-list">

        `;


        chatHistory.forEach(message => {

            const isUser =
                message.role === "user";


            const name =
                isUser
                    ? "Prasanna"
                    : "Avani";


            const avatar =
                isUser
                    ? "/static/assets/prasanna.png"
                    : "/static/assets/avani-girl.png";


            const messageText =
                escapeHtml(
                    message.text || ""
                );


            const messageTime =
                message.time
                    ? new Date(
                        message.time
                    ).toLocaleTimeString(
                        [],
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    )
                    : "Now";


            content += `

                <div class="chat-history-message ${isUser ? "history-user" : "history-avani"}">

                    <div class="history-small-avatar">

                        <img
                            src="${avatar}"
                            alt="${name}"
                        >

                    </div>


                    <div class="history-message-content">

                        <div class="history-message-top">

                            <span class="history-message-name">
                                ${name}
                            </span>

                            <span class="history-message-time">
                                ${messageTime}
                            </span>

                        </div>


                        <div class="history-message-text">
                            ${messageText}
                        </div>

                    </div>

                </div>

            `;

        });


        content += `

            </div>

        `;

    }


    content += `

        </div>

    `;


    createPanel(
        "💬 Chat History",
        content
    );

}

/* =========================================================
   CLEAR HISTORY FROM PANEL
========================================================= */

function clearHistoryFromPanel() {

    const confirmDelete =
        confirm(
            "Delete all chat history?"
        );

    if (!confirmDelete) {
        return;
    }


    chatHistory = [];


    localStorage.removeItem(
        "avani_chat_history"
    );


    closePanel();


    setTimeout(
        () => {

            openChatHistoryPanel();

        },
        100
    );

}
/* =========================================================
   MEMORY PANEL
========================================================= */

function openMemoryPanel()
 {

    let content = `

        <p>
            Avani can remember useful
            information using your browser.
        </p>

        <button
            class="panel-button"
            onclick="addMemory()"
        >
            ＋ Add Memory
        </button>

    `;

    if (memories.length) {

        content += `

            <br>

            <strong>
                Saved Memories
            </strong>

        `;

        memories.forEach(
            (memory, index) => {

                content += `

                    <div
                        style="
                            margin-top:10px;
                            padding:12px;
                            border:1px solid rgba(80,120,220,.2);
                            border-radius:10px;
                            background:#0b192c;
                        "
                    >

                        ${escapeHtml(memory)}

                        <button
                            class="panel-button"
                            onclick="deleteMemory(${index})"
                        >
                            Delete
                        </button>

                    </div>

                `;
            }
        );
    }

    createPanel(
        "🧠 Memory",
        content
    );
}


function addMemory() {

    const value =
        prompt(
            "What should Avani remember?"
        );

    if (
        !value ||
        !value.trim()
    ) {

        return;
    }

    memories.push(
        value.trim()
    );

    localStorage.setItem(
        "avani_memories",
        JSON.stringify(memories)
    );

    openMemoryPanel();
}


function deleteMemory(index) {

    memories.splice(
        index,
        1
    );

    localStorage.setItem(
        "avani_memories",
        JSON.stringify(memories)
    );

    openMemoryPanel();
}


/* =========================================================
   TASKS PANEL
========================================================= */

function openTasksPanel() {

    let content = `

        <button
            class="panel-button"
            onclick="addTask()"
        >
            ＋ Add Task
        </button>

    `;

    if (
        tasks.length === 0
    ) {

        content += `

            <br><br>

            <p>
                No additional tasks yet.
            </p>

        `;

    }

    tasks.forEach(
        (task, index) => {

            const status =
                task.completed
                    ? "✅"
                    : "⬜";

            content += `

                <div
                    style="
                        margin-top:10px;
                        padding:12px;
                        border:1px solid rgba(80,120,220,.2);
                        border-radius:10px;
                        background:#0b192c;
                    "
                >

                    ${status}
                    ${escapeHtml(task.text)}

                    <button
                        class="panel-button"
                        onclick="toggleTask(${index})"
                    >
                        ${task.completed ? "Undo" : "Complete"}
                    </button>

                    <button
                        class="panel-button"
                        onclick="deleteTask(${index})"
                    >
                        Delete
                    </button>

                </div>

            `;
        }
    );

    createPanel(
        "✓ Tasks",
        content
    );
}


function addTask() {

    const value =
        prompt(
            "Enter your task:"
        );

    if (
        !value ||
        !value.trim()
    ) {

        return;
    }

    tasks.push({

        text:
            value.trim(),

        completed:
            false,

        createdAt:
            new Date().toISOString()

    });

    saveTasks();

    openTasksPanel();
}


function deleteTask(index) {

    tasks.splice(
        index,
        1
    );

    saveTasks();

    openTasksPanel();
}


function toggleTask(index) {

    if (!tasks[index]) {

        return;
    }

    tasks[index].completed =
        !tasks[index].completed;

    saveTasks();

    openTasksPanel();
}


/* =========================================================
   NOTES PANEL
========================================================= */

function openNotesPanel() {

    let content = `

        <button
            class="panel-button"
            onclick="addNote()"
        >
            ＋ New Note
        </button>

    `;

    if (
        notes.length === 0
    ) {

        content += `

            <br><br>

            <p>
                You don't have any notes yet.
            </p>

        `;

    }

    notes.forEach(
        (note, index) => {

            content += `

                <div
                    style="
                        margin-top:10px;
                        padding:14px;
                        border:1px solid rgba(80,120,220,.2);
                        border-radius:10px;
                        background:#0b192c;
                    "
                >

                    <strong>
                        ${escapeHtml(note.title)}
                    </strong>

                    <br><br>

                    ${escapeHtml(note.content)}

                    <br>

                    <button
                        class="panel-button"
                        onclick="editNote(${index})"
                    >
                        Edit
                    </button>

                    <button
                        class="panel-button"
                        onclick="deleteNote(${index})"
                    >
                        Delete
                    </button>

                </div>

            `;
        }
    );

    createPanel(
        "▤ Notes",
        content
    );
}


/* =========================================================
   ADD NOTE
========================================================= */

function addNote() {

    const title =
        prompt(
            "Note title:"
        );

    if (
        !title ||
        !title.trim()
    ) {

        return;
    }

    const content =
        prompt(
            "Write your note:"
        );

    if (
        !content ||
        !content.trim()
    ) {

        return;
    }

    notes.push({

        title:
            title.trim(),

        content:
            content.trim(),

        createdAt:
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()

    });

    saveNotes();

    openNotesPanel();
}


/* =========================================================
   EDIT NOTE
========================================================= */

function editNote(index) {

    if (!notes[index]) {

        return;
    }

    const note =
        notes[index];

    const newTitle =
        prompt(
            "Edit note title:",
            note.title
        );

    if (
        newTitle === null ||
        !newTitle.trim()
    ) {

        return;
    }

    const newContent =
        prompt(
            "Edit note content:",
            note.content
        );

    if (
        newContent === null ||
        !newContent.trim()
    ) {

        return;
    }

    note.title =
        newTitle.trim();

    note.content =
        newContent.trim();

    note.updatedAt =
        new Date().toISOString();

    saveNotes();

    openNotesPanel();
}


/* =========================================================
   DELETE NOTE
========================================================= */

function deleteNote(index) {

    if (!notes[index]) {

        return;
    }

    const confirmed =
        confirm(
            `Delete note "${notes[index].title}"?`
        );

    if (!confirmed) {

        return;
    }

    notes.splice(
        index,
        1
    );

    saveNotes();

    openNotesPanel();
}


/* =========================================================
   LEARNING HUB
========================================================= */

function openLearningPanel() {

    createPanel(

        "🎓 Learning Hub",

        `

            <p>
                Choose something you want to learn.
            </p>

            <button
                class="panel-button"
                onclick="askAvani('Teach me Python from beginner to advanced.')"
            >
                🐍 Python
            </button>

            <button
                class="panel-button"
                onclick="askAvani('Teach me Machine Learning step by step.')"
            >
                🤖 Machine Learning
            </button>

            <button
                class="panel-button"
                onclick="askAvani('Teach me Artificial Intelligence.')"
            >
                🧠 Artificial Intelligence
            </button>

            <button
                class="panel-button"
                onclick="askAvani('Teach me FastAPI.')"
            >
                ⚡ FastAPI
            </button>

            <button
                class="panel-button"
                onclick="askAvani('Give me a roadmap to become an AI ML engineer.')"
            >
                🚀 AI/ML Roadmap
            </button>

        `

    );
}


/* =========================================================
   TOOLS
========================================================= */

function openToolsPanel() {

    createPanel(

        "🛠 Tools",

        `

            <button
                class="panel-button"
                onclick="openCalculator()"
            >
                🧮 Calculator
            </button>

            <button
                class="panel-button"
                onclick="setReminder()"
            >
                ⏰ Reminder
            </button>

            <button
                class="panel-button"
                onclick="askAvani('Help me with programming or coding.')"
            >
                💻 Code Help
            </button>

            <button
                class="panel-button"
                onclick="askAvani('Create a useful study plan for me.')"
            >
                🎓 Study Plan
            </button>

        `

    );
}


/* =========================================================
   CALCULATOR
========================================================= */

function openCalculator() {

    const expression =
        prompt(
            "Enter calculation, example: 25 * 4"
        );

    if (!expression) {

        return;
    }

    try {

        const result =
            Function(
                `"use strict"; return (${expression})`
            )();

        alert(
            "Result: " + result
        );

    }

    catch {

        alert(
            "Invalid calculation."
        );
    }
}


/* =========================================================
   REMINDER
========================================================= */

function setReminder() {

    const text =
        prompt(
            "What should I remind you about?"
        );

    if (
        !text ||
        !text.trim()
    ) {

        return;
    }

    const minutes =
        parseInt(
            prompt(
                "After how many minutes?"
            )
        );

    if (
        isNaN(minutes) ||
        minutes <= 0
    ) {

        alert(
            "Please enter a valid number."
        );

        return;
    }

    setTimeout(
        () => {

            alert(
                "⏰ Avani Reminder\n\n" +
                text
            );

        },
        minutes * 60 * 1000
    );

    alert(
        `Reminder set for ${minutes} minute(s).`
    );
}


/* =========================================================
   SETTINGS
========================================================= */

function openSettingsPanel() {

    createPanel(

        "⚙ Settings",

        `

            <p>
                Avani is currently running locally.
            </p>

            <br>

            <p>
                <strong>
                    AI Model
                </strong>
            </p>

            <p>
                Ollama — Llama 3.2 3B
            </p>

            <br>

            <p>
                <strong>
                    Backend
                </strong>
            </p>

            <p>
                FastAPI
            </p>

            <br>

            <p>
                <strong>
                    Memory
                </strong>
            </p>

            <p>
                Browser Local Storage
            </p>

            <button
                class="panel-button"
                onclick="clearAvaniData()"
            >
                Clear Avani Local Data
            </button>

        `

    );
}


function clearAvaniData() {

    const confirmed =
        confirm(
            "Delete Avani's saved memories, tasks and notes?"
        );

    if (!confirmed) {

        return;
    }

    localStorage.removeItem(
        "avani_memories"
    );

    localStorage.removeItem(
        "avani_tasks"
    );

    localStorage.removeItem(
        "avani_notes"
    );

    memories = [];

    tasks = [];

    notes = [];

    alert(
        "Avani local data has been cleared."
    );

    closePanel();
}


/* =========================================================
   RIGHT QUICK TOOLS
========================================================= */

document
    .querySelectorAll(
        ".tools-grid button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const text =
                    button.textContent
                        .trim()
                        .toLowerCase();

                if (
                    text.includes("new note")
                ) {

                    addNote();

                    return;
                }

                if (
                    text.includes("reminder")
                ) {

                    setReminder();

                    return;
                }

                if (
                    text.includes("code help")
                ) {

                    askAvani(
                        "Help me with programming or coding."
                    );

                    return;
                }

                if (
                    text.includes("study plan")
                ) {

                    askAvani(
                        "Create a useful study plan for me."
                    );

                    return;
                }

            }
        );

    });


/* =========================================================
   ADD TASK BUTTON
========================================================= */

const addTaskButton =
    document.querySelector(
        ".add-task"
    );

if (addTaskButton) {

    addTaskButton.addEventListener(
        "click",
        addTask
    );
}


/* =========================================================
   TASK CHECKBOXES
========================================================= */

document
    .querySelectorAll(
        ".task input[type='checkbox']"
    )
    .forEach(
        checkbox => {

            checkbox.addEventListener(
                "change",
                () => {

                    const task =
                        checkbox.closest(
                            ".task"
                        );

                    if (!task) {

                        return;
                    }

                    task.classList.toggle(
                        "completed",
                        checkbox.checked
                    );

                }
            );

        }
    );


/* =========================================================
   ASK AVANI
========================================================= */

function askAvani(message) {

    closePanel();

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            item => {

                item.classList.remove(
                    "active"
                );

            }
        );

    const chatButton =
        document.querySelector(
            '.nav-item[data-page="chat"]'
        );

    if (chatButton) {

        chatButton.classList.add(
            "active"
        );
    }

    messageInput.value =
        message;

    messageInput.focus();

    sendMessage();
}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollChat() {

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        text;

    return div.innerHTML;
}


/* =========================================================
   FORMAT RESPONSE
========================================================= */

function formatResponse(text) {

    return escapeHtml(text)
        .replace(
            /\n/g,
            "<br>"
        );
}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closePrasannaModal();

            closePanel();

        }

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

if (messageInput) {

    messageInput.focus();
}


/* =========================================================
   RESTORE CHAT HISTORY
========================================================= */

restoreChatHistory();


console.log(
    "Avani AI initialized successfully."
);

console.log(
    "Prasanna AI Solutions"
);


/* =========================================================
   FUTURISTIC CURSOR TRAIL
   DESIGN EFFECT PRESERVED
========================================================= */

let lastParticleTime = 0;

document.addEventListener(
    "mousemove",
    event => {

        const now =
            Date.now();

        if (
            now - lastParticleTime < 35
        ) {

            return;
        }

        lastParticleTime =
            now;

        const particle =
            document.createElement("span");

        particle.className =
            "cursor-particle";

        particle.style.left =
            event.clientX + "px";

        particle.style.top =
            event.clientY + "px";

        const moveX =
            (Math.random() - 0.5) * 35;

        const moveY =
            (Math.random() - 0.5) * 35;

        particle.style.setProperty(
            "--particle-x",
            `${moveX}px`
        );

        particle.style.setProperty(
            "--particle-y",
            `${moveY}px`
        );

        const size =
            3 + Math.random() * 4;

        particle.style.width =
            `${size}px`;

        particle.style.height =
            `${size}px`;

        document.body.appendChild(
            particle
        );

        setTimeout(
            () => {

                particle.remove();

            },
            700
        );

    }
);
/* =========================================================
   DELETE CHAT HISTORY
========================================================= */

function deleteChatHistory() {

    const confirmed =
        confirm(
            "Are you sure you want to delete all chat history?"
        );

    if (!confirmed) {
        return;
    }


    chatHistory = [];


    localStorage.removeItem(
        "avani_chat_history"
    );


    closePanel();


    alert(
        "Chat history deleted successfully."
    );

}

/* =========================================================
   AVANI VOICE ASSISTANCE
   SPEECH TO TEXT + AVANI VOICE RESPONSE
   DESIGN / HTML / CSS ARE NOT CHANGED
========================================================= */

const voiceButton =
    document.getElementById("voiceButton");

let speechRecognition = null;


/* =========================================================
   CHECK BROWSER VOICE SUPPORT
========================================================= */

if (
    voiceButton &&
    (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
    )
) {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    speechRecognition =
        new SpeechRecognition();


    speechRecognition.continuous =
        false;

    speechRecognition.interimResults =
        false;

    speechRecognition.lang =
        "en-IN";


    /* =====================================================
       MICROPHONE BUTTON
    ===================================================== */

    voiceButton.addEventListener(
        "click",
        () => {

            try {

                speechRecognition.start();

                voiceButton.classList.add(
                    "recording"
                );

                voiceButton.title =
                    "Listening...";

                console.log(
                    "Avani is listening..."
                );

            }
            catch (error) {

                console.log(
                    "Voice recognition is already running."
                );

            }

        }
    );


    /* =====================================================
       SPEECH RESULT
    ===================================================== */

    speechRecognition.onresult =
        event => {

            const transcript =
                event
                    .results[0][0]
                    .transcript
                    .trim();


            console.log(
                "You said:",
                transcript
            );


            if (!transcript) {
                return;
            }


            messageInput.value =
                transcript;


            messageInput.focus();


            voiceButton.classList.remove(
                "recording"
            );

            voiceButton.title =
                "Voice";


            /* ---------------------------------------------
               Automatically send voice message
            --------------------------------------------- */

            sendMessage();

        };


    /* =====================================================
       VOICE ERROR
    ===================================================== */

    speechRecognition.onerror =
        event => {

            console.error(
                "Avani voice error:",
                event.error
            );


            voiceButton.classList.remove(
                "recording"
            );


            voiceButton.title =
                "Voice";


            if (
                event.error ===
                "not-allowed"
            ) {

                alert(
                    "Please allow microphone access for Avani."
                );

            }

            else if (
                event.error ===
                "no-speech"
            ) {

                console.log(
                    "No speech detected."
                );

            }

        };


    /* =====================================================
       VOICE RECOGNITION ENDED
    ===================================================== */

    speechRecognition.onend =
        () => {

            voiceButton.classList.remove(
                "recording"
            );

            voiceButton.title =
                "Voice";

        };

}
else if (voiceButton) {

    voiceButton.addEventListener(
        "click",
        () => {

            alert(
                "Voice input is not supported in this browser. Please use Google Chrome."
            );

        }
    );

}


/* =========================================================
   AVANI TEXT TO SPEECH
   READS AVANI'S RESPONSE ALOUD
========================================================= */
function speakAvani(text) {

    if (!("speechSynthesis" in window)) {
        console.log("Speech synthesis is not supported.");
        return;
    }

    speechSynthesis.cancel();

    function speakWithFemaleVoice() {

        const voices =
            speechSynthesis.getVoices();

        console.log("Available voices:", voices);

        if (!voices.length) {
            setTimeout(speakWithFemaleVoice, 300);
            return;
        }

        /*
         * Female voice priority
         */
        const femaleVoice =
            voices.find(voice =>
                /Microsoft Zira/i.test(voice.name)
            ) ||
            voices.find(voice =>
                /Microsoft Jenny/i.test(voice.name)
            ) ||
            voices.find(voice =>
                /Microsoft Aria/i.test(voice.name)
            ) ||
            voices.find(voice =>
                /Samantha/i.test(voice.name)
            ) ||
            voices.find(voice =>
                /Google UK English Female/i.test(voice.name)
            ) ||
            voices.find(voice =>
                /Google US English Female/i.test(voice.name)
            ) ||
            voices.find(voice =>
                /Female/i.test(voice.name)
            );

        /*
         * If a known female voice exists,
         * use it.
         */
        if (!femaleVoice) {
            console.warn(
                "No female voice found on this computer."
            );

            alert(
                "Avani could not find a female voice installed in Chrome/Windows."
            );

            return;
        }

        const utterance =
            new SpeechSynthesisUtterance(text);

        utterance.voice =
            femaleVoice;

        utterance.lang =
            femaleVoice.lang || "en-IN";

        utterance.rate =
            0.95;

        utterance.pitch =
            1.05;

        utterance.volume =
            1;

        console.log(
            "Avani female voice:",
            femaleVoice.name,
            femaleVoice.lang
        );

        speechSynthesis.speak(
            utterance
        );
    }

    /*
     * Chrome sometimes loads voices
     * asynchronously.
     */
    if (
        speechSynthesis.getVoices().length === 0
    ) {

        speechSynthesis.onvoiceschanged =
            () => {

                speechSynthesis.onvoiceschanged =
                    null;

                speakWithFemaleVoice();
            };

        setTimeout(
            speakWithFemaleVoice,
            500
        );

    } else {

        speakWithFemaleVoice();
    }
}

/* =========================================================
   VOICE RESPONSE HOOK
   PATCH AVANI MESSAGE FUNCTION
========================================================= */

const originalAddAssistantMessage =
    addAssistantMessage;


addAssistantMessage =
    function(
        text,
        saveToHistory = true
    ) {

        originalAddAssistantMessage(
            text,
            saveToHistory
        );


        speakAvani(
            text
        );

    };


/* =========================================================
   VOICE ASSISTANCE READY
========================================================= */

console.log(
    "Avani Voice Assistance initialized successfully."
);
/* =========================================================
   AVANI FILE ATTACHMENT
   STEP 1 - OPEN FILE PICKER
========================================================= */

const attachButton =
    document.getElementById("attachButton");

if (attachButton) {

    attachButton.addEventListener(
        "click",
        () => {

            const fileInput =
                document.createElement("input");

            fileInput.type = "file";

            fileInput.accept =
                ".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg";

            fileInput.click();

            fileInput.addEventListener(
                "change",
                () => {

                    const file =
                        fileInput.files[0];

                    if (!file) {
                        return;
                    }

                    console.log(
                        "File selected:",
                        file.name
                    );

                    alert(
                        "Selected file: " +
                        file.name
                    );
                }
            );
        }
    );

}
/* =========================================================
   AVANI FILE INTELLIGENCE
   FILE SELECT + UPLOAD + CHAT BOX PREVIEW
========================================================= */

async function avaniFileSelected(input) {

    if (
        !input ||
        !input.files ||
        !input.files.length
    ) {
        return;
    }


    const file = input.files[0];


    /* =====================================================
       STORE FILE LOCALLY
    ===================================================== */

    avaniSelectedFile = file;


    console.log(
        "Avani file selected:",
        file.name
    );


    console.log(
        "File type:",
        file.type
    );


    console.log(
        "File size:",
        file.size,
        "bytes"
    );


    /* =====================================================
       SHOW FILE IN CHAT BOX
    ===================================================== */

    const filePreview =
        document.getElementById(
            "avaniFilePreview"
        );


    const fileName =
        document.getElementById(
            "avaniFileName"
        );


    if (
        filePreview &&
        fileName
    ) {

        fileName.textContent =
            file.name;

        filePreview.style.display =
            "flex";
    }


    /* =====================================================
       PREPARE FILE FOR FASTAPI
    ===================================================== */

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    /* =====================================================
       UPLOAD TO FASTAPI
    ===================================================== */

    try {

        console.log(
            "Uploading file to Avani backend..."
        );


        const response =
            await fetch(
                "/upload-file",
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            throw new Error(
                "Backend upload failed."
            );

        }


        const data =
            await response.json();


        console.log(
            "Upload response:",
            data
        );


        /* =================================================
           UPLOAD FAILED
        ================================================= */

        if (!data.success) {

            avaniSelectedFile =
                null;


            if (filePreview) {

                filePreview.style.display =
                    "none";

            }


            if (fileName) {

                fileName.textContent =
                    "";

            }


            alert(
                data.message ||
                "Avani could not upload this file."
            );


            input.value =
                "";


            return;
        }


        /* =================================================
           UPLOAD SUCCESS
        ================================================= */

        avaniSelectedFile = {

            file: file,

            filename:
                data.filename,

            extension:
                data.extension,

            size:
                data.size,

            filePath:
                data.file_path

        };


        console.log(
            "File successfully attached:",
            avaniSelectedFile
        );


        /* =================================================
           KEEP FILE VISIBLE IN CHAT BOX
        ================================================= */

        if (
            filePreview &&
            fileName
        ) {

            fileName.textContent =
                data.filename;

            filePreview.style.display =
                "flex";

        }


        console.log(
            "Avani is ready to analyze:",
            data.filename
        );


    }
    catch (error) {

        console.error(
            "Avani file upload error:",
            error
        );


        avaniSelectedFile =
            null;


        if (filePreview) {

            filePreview.style.display =
                "none";

        }


        if (fileName) {

            fileName.textContent =
                "";

        }


        input.value =
            "";


        alert(
            "Avani could not upload the file.\n\n" +
            "Please make sure FastAPI is running."
        );

    }

}
/* =========================================================
   CLEAR ATTACHED FILE AFTER CHAT
========================================================= */

function clearAvaniAttachedFile() {

    avaniSelectedFile = null;

    const filePreview =
        document.getElementById(
            "avaniFilePreview"
        );

    const fileName =
        document.getElementById(
            "avaniFileName"
        );

    const fileInput =
        document.getElementById(
            "avaniFileInput"
        );


    if (filePreview) {

        filePreview.style.display =
            "none";
    }


    if (fileName) {

        fileName.textContent =
            "";
    }


    if (fileInput) {

        fileInput.value =
            "";
    }

}
/* =========================================================
   AVANI FULL IMAGE VIEW
   SHOW COMPLETE AVANI IMAGE IN CENTER
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const avaniFocusButton =
            document.getElementById(
                "avaniFocusButton"
            );


        if (!avaniFocusButton) {

            console.error(
                "Avani Full Image View: button not found."
            );

            return;
        }


        avaniFocusButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                openAvaniFullImage();

            }
        );

    }
);


/* =========================================================
   OPEN FULL AVANI IMAGE
========================================================= */

function openAvaniFullImage() {

    const existingModal =
        document.getElementById(
            "avaniFullImageModal"
        );


    if (existingModal) {

        return;

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "avaniFullImageModal";


    modal.className =
        "avani-full-image-modal";


    modal.innerHTML = `

        <!-- BACKGROUND -->

        <div
            class="avani-full-image-backdrop"
            onclick="closeAvaniFullImage()"
        ></div>


        <!-- CENTER CONTENT -->

        <div
            class="avani-full-image-container"
        >


            <!-- CLOSE -->

            <button
                class="avani-full-image-close"
                onclick="closeAvaniFullImage()"
                aria-label="Close Avani image"
                title="Close"
            >
                ×
            </button>


            <!-- GLOWING FRAME -->

            <div
                class="avani-image-glow-frame"
            >

                <div
                    class="avani-image-border"
                >

                    <img
                        src="/static/assets/avani-girl.png"
                        alt="Avani"
                        class="avani-full-image"
                    >

                </div>

            </div>


            <!-- AVANI NAME -->

            <div
                class="avani-full-image-title"
            >

                <span
                    class="avani-title-dot"
                ></span>

                AVANI

                <span
                    class="avani-title-status"
                >
                    ONLINE
                </span>

            </div>


            <div
                class="avani-full-image-subtitle"
            >
                Prasanna's AI Assistant
            </div>


        </div>

    `;


    document.body.appendChild(
        modal
    );


    requestAnimationFrame(
        () => {

            modal.classList.add(
                "show"
            );

        }
    );


    document.body.classList.add(
        "avani-full-image-open"
    );


    document.addEventListener(
        "keydown",
        avaniFullImageEscape
    );

}


/* =========================================================
   CLOSE FULL AVANI IMAGE
========================================================= */

function closeAvaniFullImage() {

    const modal =
        document.getElementById(
            "avaniFullImageModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "avani-full-image-open"
    );


    document.removeEventListener(
        "keydown",
        avaniFullImageEscape
    );


    setTimeout(
        () => {

            if (modal) {

                modal.remove();

            }

        },
        300
    );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

function avaniFullImageEscape(
    event
) {

    if (
        event.key === "Escape"
    ) {

        closeAvaniFullImage();

    }

}