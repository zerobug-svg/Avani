from fastapi import FastAPI, UploadFile, File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import requests
import os
import shutil
import base64
from dotenv import load_dotenv

load_dotenv()

from pypdf import PdfReader
from docx import Document


# ============================================================
# AI PROVIDER CONFIGURATION
# ============================================================

AI_PROVIDER = os.getenv(
    "AVANI_AI_PROVIDER",
    "ollama"
).lower()

OLLAMA_URL = os.getenv(
    "OLLAMA_URL",
    "http://127.0.0.1:11434/api/generate"
)

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2:3b"
)

OLLAMA_VISION_MODEL = os.getenv(
    "OLLAMA_VISION_MODEL",
    "gemma3:4b"
)

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.5-flash"
)

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/"
    "v1beta/models/"
    + GEMINI_MODEL
    + ":generateContent"
)


# ============================================================
# AVANI - PRASANNA'S PERSONAL AI ASSISTANT
# ============================================================

app = FastAPI(
    title="Avani",
    description="Prasanna's Personal AI Assistant",
    version="2.2.0"
)


# ============================================================
# CONFIGURATION
# ============================================================

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")
# ============================================================
# COMMON AI RESPONSE FUNCTION
# ============================================================

def generate_ai_response(
    prompt: str,
    model: str | None = None,
    image_base64: str | None = None,
    mime_type: str = "image/jpeg",
    timeout: int = 180
):
    """
    Generate an AI response using the configured provider.

    Local:
        AVANI_AI_PROVIDER=ollama

    Cloud:
        AVANI_AI_PROVIDER=gemini
    """

    # ========================================================
    # GEMINI
    # ========================================================

    if AI_PROVIDER == "gemini":

        if not GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured."
            )

        parts = [
            {
                "text": prompt
            }
        ]

        # Add image when image intelligence is being used
        if image_base64:
            parts.append(
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": image_base64
                    }
                }
            )

        payload = {
            "contents": [
                {
                    "parts": parts
                }
            ]
        }

        response = requests.post(
            GEMINI_URL,
            headers={
                "x-goog-api-key": GEMINI_API_KEY,
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=timeout
        )

        response.raise_for_status()

        data = response.json()

        candidates = data.get("candidates", [])

        if not candidates:
            raise RuntimeError(
                "Gemini returned no response."
            )

        content = candidates[0].get(
            "content",
            {}
        )

        response_parts = content.get(
            "parts",
            []
        )

        text = "".join(
            part.get("text", "")
            for part in response_parts
        ).strip()

        if not text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        return text

    # ========================================================
    # OLLAMA
    # ========================================================

    payload = {
        "model": model or OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    # Ollama vision model
    if image_base64:
        payload["model"] = (
            model or OLLAMA_VISION_MODEL
        )

        payload["images"] = [
            image_base64
        ]

    response = requests.post(
        OLLAMA_URL,
        json=payload,
        timeout=timeout
    )

    response.raise_for_status()

    data = response.json()

    text = data.get(
        "response",
        ""
    ).strip()

    if not text:
        raise RuntimeError(
            "Ollama returned an empty response."
        )

    return text
UPLOAD_FOLDER = "uploads"

def search_web(query: str):

    if not TAVILY_API_KEY:

        return {
            "success": False,
            "results": [],
            "message":
                "Web search is not configured."
        }


    try:

        response = requests.post(

            "https://api.tavily.com/search",

            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "basic",
                "include_answer": False,
                "max_results": 5
            },

            timeout=30
        )


        if not response.ok:

            return {
                "success": False,
                "results": [],
                "message":
                    "Web search could not be completed."
            }


        data = response.json()

        results = []


        for item in data.get(
            "results",
            []
        ):

            results.append({

                "title":
                    item.get(
                        "title",
                        ""
                    ),

                "url":
                    item.get(
                        "url",
                        ""
                    ),

                "content":
                    item.get(
                        "content",
                        ""
                    )

            })


        return {
            "success": True,
            "results": results
        }


    except Exception as error:

        print(
            "WEB SEARCH ERROR:",
            error
        )

        return {
            "success": False,
            "results": [],
            "message":
                "Web search is temporarily unavailable."
        }
    # ============================================================
# WEB SEARCH - CHAT WITH WEB RESULTS
# ============================================================

class WebSearchRequest(BaseModel):

    message: str


@app.post("/web-search")
async def web_search_chat(request: WebSearchRequest):

    try:

        # -------------------------------------------------
        # Search the web
        # -------------------------------------------------

        search_result = search_web(
            request.message
        )


        if not search_result.get(
            "success"
        ):

            return {

                "success": False,

                "response":
                    search_result.get(
                        "message",
                        "Web search could not be completed."
                    )

            }


        results = (
            search_result.get(
                "results",
                []
            )
        )


        if not results:

            return {

                "success": False,

                "response":
                    "I couldn't find useful results for that search."
            }


        # -------------------------------------------------
        # Prepare search results for Avani
        # -------------------------------------------------

        web_context_parts = []


        for index, result in enumerate(
            results,
            start=1
        ):

            web_context_parts.append(

                f"""
SOURCE {index}

TITLE:
{result.get("title", "")}

URL:
{result.get("url", "")}

CONTENT:
{result.get("content", "")}
"""
            )


        web_context = (
            "\n\n".join(
                web_context_parts
            )
        )


        # -------------------------------------------------
        # Create web-aware prompt
        # -------------------------------------------------

        web_prompt = (

            SYSTEM_PROMPT +

            "\n\n"

            "You are answering a question "
            "using fresh web search results.\n\n"

            "WEB SEARCH RESULTS:\n"
            "====================\n"

            + web_context +

            "\n\n"
            "====================\n\n"

            "USER QUESTION:\n"

            + request.message +

            "\n\n"

            "Answer the user's question using "
            "the web search results above. "

            "Prefer information supported by "
            "the search results. "

            "If the results do not contain "
            "enough information, say so clearly. "

            "Do not invent facts. "

            "When useful, mention the source "
            "title or website in your answer."
        )


               # -------------------------------------------------
        # Generate AI response
        # -------------------------------------------------

        try:

            response_text = generate_ai_response(
                prompt=web_prompt,
                model=OLLAMA_MODEL,
                timeout=120
            )

        except Exception as error:

            print(
                "WEB AI RESPONSE ERROR:",
                error
            )

            return {
                "success": False,
                "response":
                    "I found web results, but I couldn't generate an answer right now.",
                "error":
                    str(error)
            }


        return {
            "success": True,
            "response":
                response_text,
            "sources":
                results
        }


    except Exception as error:

        print(
            "WEB SEARCH CHAT ERROR:",
            error
        )

        return {
            "success": False,
            "response":
                "I couldn't complete the web search right now.",
            "error":
                str(error)
        }


# ============================================================
# CREATE UPLOAD FOLDER
# ============================================================

os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)
# ============================================================
# ALLOWED FILE TYPES
# ============================================================

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".csv",
    ".xlsx",
    ".xls",
    ".png",
    ".jpg",
    ".jpeg"
}


# ============================================================
# FRONTEND
# ============================================================

app.mount(
    "/static",
    StaticFiles(directory="frontend"),
    name="static"
)


@app.get("/")
def home():

    return FileResponse(
        "frontend/index.html"
    )


# ============================================================
# AVANI PERSONALITY
# ============================================================

SYSTEM_PROMPT = """
You are Avani.

You are Prasanna's personal AI assistant.

IDENTITY:

- Your name is Avani.
- You are Prasanna's AI assistant.
- Prasanna is your primary user.
- You are a local AI assistant powered by Ollama.
- You are not a human.
- Never claim to be a real human.

PERSONALITY:

You are:
- Friendly
- Intelligent
- Calm
- Helpful
- Supportive
- Practical
- Encouraging
- Professional

USER:

The user's name is Prasanna.

Always remember that you are assisting Prasanna.

If Prasanna asks who you are, answer naturally:

"I'm Avani, Prasanna's personal AI assistant."

Do not introduce yourself unnecessarily in every response.

YOU HELP PRASANNA WITH:

- Artificial Intelligence
- Machine Learning
- Python
- Programming
- Software development
- Web development
- AI projects
- ML projects
- Learning
- Career preparation
- Productivity
- Planning
- Problem solving
- Project ideas
- Technical explanations
- General questions

ANSWERING STYLE:

Give clear and useful answers.

For technical questions:
- Explain step by step.
- Give examples when useful.
- Give code when requested.
- Do not unnecessarily complicate simple questions.

For learning:
- Teach patiently.
- Explain concepts simply.
- Help Prasanna understand instead of only giving answers.

For projects:
- Break projects into manageable steps.
- Tell Prasanna exactly what to do next.
- Avoid overwhelming him with unrelated steps.

IMPORTANT:

Never pretend an action was performed if it was not actually performed.

If you do not know something, honestly say that you don't know.

Do not invent facts.

You are Avani, Prasanna's personal AI assistant.
"""

# ============================================================
# CHAT
# ============================================================

@app.get("/chat")
def chat(message: str):

    prompt = f"""
{SYSTEM_PROMPT}

Prasanna says:

{message}

Avani:
"""

    try:

        ai_response = generate_ai_response(
            prompt=prompt,
            model=OLLAMA_MODEL,
            timeout=120
        )

        if not ai_response:

            ai_response = (
                "I'm sorry, Prasanna. "
                "I couldn't generate a response right now."
            )

        return {
            "assistant": "Avani",
            "response": ai_response
        }

    except requests.exceptions.ConnectionError:

        return {
            "assistant": "Avani",
            "response": (
                "Prasanna, I can't connect to Ollama right now. "
                "Please make sure Ollama is running."
            )
        }

    except requests.exceptions.Timeout:

        return {
            "assistant": "Avani",
            "response": (
                "The AI is taking too long to respond. "
                "Please try again."
            )
        }

    except requests.exceptions.RequestException as error:

        return {
            "assistant": "Avani",
            "response": (
                "I couldn't communicate with the AI. "
                f"Technical error: {str(error)}"
            )
        }

    except Exception as error:

        return {
            "assistant": "Avani",
            "response": (
                "Something unexpected happened. "
                f"Technical error: {str(error)}"
            )
        }


# ============================================================
# FILE INTELLIGENCE
# ============================================================
# ============================================================
# FILE INTELLIGENCE
# FILE UPLOAD + PDF TEXT EXTRACTION
# ============================================================

@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...)
):

    try:

        # ----------------------------------------------------
        # CHECK FILE NAME
        # ----------------------------------------------------

        if not file.filename:

            return {
                "success": False,
                "message": "No file selected."
            }


        # ----------------------------------------------------
        # CHECK FILE EXTENSION
        # ----------------------------------------------------

        extension = os.path.splitext(
            file.filename
        )[1].lower()


        if extension not in ALLOWED_EXTENSIONS:

            return {
                "success": False,
                "message": (
                    "This file type is not supported."
                )
            }


        # ----------------------------------------------------
        # SAFE FILE NAME
        # ----------------------------------------------------

        safe_filename = os.path.basename(
            file.filename
        )


        file_path = os.path.join(
            UPLOAD_FOLDER,
            safe_filename
        )


        # ----------------------------------------------------
        # SAVE FILE
        # ----------------------------------------------------

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )


        # ----------------------------------------------------
        # FILE SIZE
        # ----------------------------------------------------

        file_size = os.path.getsize(
            file_path
        )


        # ----------------------------------------------------
        # EXTRACTED TEXT
        # ----------------------------------------------------

        extracted_text = ""


        # ====================================================
        # PDF
        # ====================================================

        if extension == ".pdf":

            try:

                reader = PdfReader(
                    file_path
                )

                pages = []


                for page in reader.pages:

                    page_text = page.extract_text()

                    if page_text:

                        pages.append(
                            page_text
                        )


                extracted_text = "\n\n".join(
                    pages
                ).strip()


            except Exception as error:

                return {
                    "success": False,
                    "message": (
                        "The PDF was uploaded, "
                        "but Avani could not read its text."
                    ),
                    "error": str(error)
                }


        # ====================================================
        # TXT
        # ====================================================

        elif extension == ".txt":

            try:

                with open(
                    file_path,
                    "r",
                    encoding="utf-8",
                    errors="ignore"
                ) as text_file:

                    extracted_text = text_file.read()

            except Exception as error:

                return {
                    "success": False,
                    "message": (
                        "The text file was uploaded, "
                        "but Avani could not read it."
                    ),
                    "error": str(error)
                }


        # ====================================================
        # SUCCESS
        # ====================================================

        return {
            "success": True,
            "message": (
                "File uploaded and processed successfully."
            ),
            "filename": safe_filename,
            "extension": extension,
            "size": file_size,
            "file_path": file_path,
            "text_length": len(extracted_text),
            "text": extracted_text
        }


    except Exception as error:

        return {
            "success": False,
            "message": "File processing failed.",
            "error": str(error)
        }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "online",
        "assistant": "Avani",
        "owner": "Prasanna",
        "provider": AI_PROVIDER,
        "model": (
            GEMINI_MODEL
            if AI_PROVIDER == "gemini"
            else OLLAMA_MODEL
        ),
        "ollama": (
            "Connected"
            if AI_PROVIDER == "ollama"
            else "Not Used"
        )
    }

# =========================================================
# FILE INTELLIGENCE - CHAT WITH FILE
# =========================================================

from pypdf import PdfReader


class FileChatRequest(BaseModel):

    message: str
    file_path: str

@app.post("/chat-with-file")
async def chat_with_file(request: FileChatRequest):

    try:

        # -------------------------------------------------
        # Validate file path
        # -------------------------------------------------

        requested_path = os.path.abspath(
            request.file_path
        )

        upload_folder = os.path.abspath(
            UPLOAD_FOLDER
        )

        if not requested_path.startswith(
            upload_folder + os.sep
        ):
            return {
                "success": False,
                "response":
                    "I couldn't access that file."
            }


        # -------------------------------------------------
        # Check file exists
        # -------------------------------------------------

        if not os.path.exists(
            requested_path
        ):
            return {
                "success": False,
                "response":
                    "The attached file could not be found."
            }


        # -------------------------------------------------
        # Get extension
        # -------------------------------------------------

        extension = os.path.splitext(
            requested_path
        )[1].lower()


        # =================================================
        # IMAGE INTELLIGENCE
        # =================================================

        if extension in {
            ".png",
            ".jpg",
            ".jpeg"
        }:

            try:

                # Read image
                with open(
                    requested_path,
                    "rb"
                ) as image_file:

                    image_bytes = (
                        image_file.read()
                    )


                # Convert image to Base64
                image_base64 = (
                    base64.b64encode(
                        image_bytes
                    ).decode(
                        "utf-8"
                    )
                )


                # Image-aware prompt
                image_prompt = (
                    SYSTEM_PROMPT +

                    "\n\n"

                    "You are analyzing an image "
                    "provided by Prasanna.\n\n"

                    "Carefully examine the image "
                    "and answer the user's question "
                    "using only information that can "
                    "be determined from the image.\n\n"

                    "If the image contains text, "
                    "read and use that text when "
                    "relevant.\n\n"

                    "If something cannot be determined "
                    "from the image, clearly say so. "
                    "Do not invent information.\n\n"

                    "USER QUESTION:\n"

                    + request.message
                )


                # Generate response using
                # configured AI provider
                response_text = generate_ai_response(
                    prompt=image_prompt,
                    model=OLLAMA_VISION_MODEL,
                    image_base64=image_base64,
                    mime_type=(
                        "image/png"
                        if extension == ".png"
                        else "image/jpeg"
                    ),
                    timeout=180
                )


                return {
                    "success": True,
                    "response":
                        response_text,
                    "filename":
                        os.path.basename(
                            requested_path
                        )
                }


            except Exception as error:

                print(
                    "IMAGE AI RESPONSE ERROR:",
                    error
                )

                return {
                    "success": False,
                    "response":
                        "I couldn't analyze the image right now.",
                    "error":
                        str(error)
                }


        # =================================================
        # DOCUMENT INTELLIGENCE
        # =================================================

        extracted_text = ""


        # -------------------------------------------------
        # PDF
        # -------------------------------------------------

        if extension == ".pdf":

            reader = PdfReader(
                requested_path
            )

            pages = []

            for page in reader.pages:

                page_text = (
                    page.extract_text()
                )

                if page_text:

                    pages.append(
                        page_text
                    )


            extracted_text = (
                "\n\n".join(
                    pages
                )
            ).strip()


        # -------------------------------------------------
        # TXT
        # -------------------------------------------------

        elif extension == ".txt":

            with open(
                requested_path,
                "r",
                encoding="utf-8",
                errors="ignore"
            ) as file:

                extracted_text = (
                    file.read()
                )


        # -------------------------------------------------
        # DOCX
        # -------------------------------------------------

        elif extension == ".docx":

            document = Document(
                requested_path
            )

            paragraphs = []

            for paragraph in document.paragraphs:

                paragraph_text = (
                    paragraph.text.strip()
                )

                if paragraph_text:

                    paragraphs.append(
                        paragraph_text
                    )


            extracted_text = (
                "\n\n".join(
                    paragraphs
                )
            ).strip()


        # -------------------------------------------------
        # Unsupported file type
        # -------------------------------------------------

        else:

            return {
                "success": False,
                "response":
                    "I can see the file, but I cannot analyze this file type yet."
            }


        # -------------------------------------------------
        # Empty document
        # -------------------------------------------------

        if not extracted_text:

            return {
                "success": False,
                "response":
                    "I couldn't extract readable text from this file."
            }


        # -------------------------------------------------
        # Protect AI from extremely large documents
        # -------------------------------------------------

        MAX_DOCUMENT_CHARS = 80000

        if len(extracted_text) > MAX_DOCUMENT_CHARS:

            extracted_text = (
                extracted_text[
                    :MAX_DOCUMENT_CHARS
                ]
            )

            document_note = (
                "\n\n"
                "[The document was very large, "
                "so only the first portion was "
                "provided to the AI.]"
            )

        else:

            document_note = ""


        # -------------------------------------------------
        # Create file-aware prompt
        # -------------------------------------------------

        file_prompt = (
            SYSTEM_PROMPT +

            "\n\n"

            "You are analyzing a document "
            "provided by Prasanna.\n\n"

            "DOCUMENT CONTENT:\n"
            "--------------------\n"

            + extracted_text +

            document_note +

            "\n\n"
            "--------------------\n\n"

            "USER QUESTION:\n"

            + request.message +

            "\n\n"

            "Answer the user's question using "
            "the document content above.\n\n"

            "If the answer is not present in "
            "the document, clearly say that "
            "the information is not available "
            "in the document.\n\n"

            "Do not invent information."
        )


        # -------------------------------------------------
        # Generate response using configured provider
        # -------------------------------------------------

        response_text = generate_ai_response(
            prompt=file_prompt,
            model=OLLAMA_MODEL,
            timeout=180
        )


        if not response_text:

            response_text = (
                "I couldn't generate an answer "
                "from the document."
            )


        return {
            "success": True,
            "response":
                response_text,
            "filename":
                os.path.basename(
                    requested_path
                )
        }


    except Exception as error:

        print(
            "FILE CHAT ERROR:",
            error
        )

        return {
            "success": False,
            "response":
                "I couldn't analyze the attached file right now.",
            "error":
                str(error)
        }

# ============================================================
# AVANI AGENT ACTIONS
# ============================================================

class AgentRequest(BaseModel):
    command: str


@app.post("/agent")
async def agent_action(request: AgentRequest):

    command = request.command.strip().lower()

    if not command:
        return {
            "success": False,
            "response": "Please tell me what you want me to do."
        }


        # --------------------------------------------------------
    # OPEN WEBSITE
    # --------------------------------------------------------

    website_map = {
        "google": "https://www.google.com",
        "youtube": "https://www.youtube.com",
        "github": "https://github.com",
        "linkedin": "https://www.linkedin.com",
        "instagram": "https://www.instagram.com",
        "facebook": "https://www.facebook.com",
        "amazon": "https://www.amazon.com",
        "netflix": "https://www.netflix.com",
        "stackoverflow": "https://stackoverflow.com",
        "reddit": "https://www.reddit.com",
        "twitter": "https://x.com",
        "x": "https://x.com"
    }


    for name, url in website_map.items():

        if (
            command == f"open {name}"
            or command == f"open {name}.com"
            or command == f"go to {name}"
            or command == f"open {name} website"
        ):

            return {
                "success": True,
                "action": "open_website",
                "url": url,
                "response": f"Opening {name}."
            }


    # --------------------------------------------------------
    # OPEN ANY WEBSITE
    # --------------------------------------------------------

    website_command = None

    if command.startswith("open "):
        website_command = command[5:].strip()

    elif command.startswith("go to "):
        website_command = command[6:].strip()


    if website_command:

        website_command = website_command.replace(
            " website",
            ""
        ).strip()


        if (
            "." in website_command
            and " " not in website_command
        ):

            url = website_command

            if not url.startswith("http://") and not url.startswith("https://"):
                url = "https://" + url

            return {
                "success": True,
                "action": "open_website",
                "url": url,
                "response": f"Opening {website_command}."
            }
        # --------------------------------------------------------
    # OPEN WINDOWS APPLICATIONS
    # --------------------------------------------------------

    import subprocess


    app_map = {
        "calculator": "calc.exe",
        "calc": "calc.exe",
        "notepad": "notepad.exe",
        "command prompt": "cmd.exe",
        "cmd": "cmd.exe",
        "file explorer": "explorer.exe",
        "explorer": "explorer.exe",
        "paint": "mspaint.exe",
        "powershell": "powershell.exe"
    }


    if command.startswith("open "):

        app_name = command[5:].strip()


        if app_name in app_map:

            try:

                subprocess.Popen(
                    app_map[app_name],
                    shell=True
                )

                return {
                    "success": True,
                    "action": "open_application",
                    "application": app_name,
                    "response":
                        f"Opening {app_name}."
                }

            except Exception as error:

                return {
                    "success": False,
                    "response":
                        f"I couldn't open {app_name}.",
                    "error": str(error)
                }
        # --------------------------------------------------------
    # OPEN WINDOWS FOLDERS
    # --------------------------------------------------------

    import os


    folder_map = {
        "desktop": os.path.join(
            os.path.expanduser("~"),
            "Desktop"
        ),

        "downloads": os.path.join(
            os.path.expanduser("~"),
            "Downloads"
        ),

        "documents": os.path.join(
            os.path.expanduser("~"),
            "Documents"
        ),

        "pictures": os.path.join(
            os.path.expanduser("~"),
            "Pictures"
        ),

        "videos": os.path.join(
            os.path.expanduser("~"),
            "Videos"
        ),

        "music": os.path.join(
            os.path.expanduser("~"),
            "Music"
        )
    }


    if command.startswith("open "):

        folder_name = command[5:].strip()


        if folder_name.startswith("my "):
            folder_name = folder_name[3:].strip()


        if folder_name in folder_map:

            folder_path = folder_map[folder_name]


            if os.path.exists(folder_path):

                try:

                    subprocess.Popen(
                        [
                            "explorer.exe",
                            folder_path
                        ]
                    )

                    return {
                        "success": True,
                        "action": "open_folder",
                        "folder": folder_name,
                        "response":
                            f"Opening your {folder_name}."
                    }

                except Exception as error:

                    return {
                        "success": False,
                        "response":
                            f"I couldn't open your {folder_name}.",
                        "error": str(error)
                    }         
    # --------------------------------------------------------
    # CALCULATOR
    # --------------------------------------------------------

    if (
        command.startswith("calculate ")
        or command.startswith("what is ")
    ):

        expression = command

        expression = expression.replace(
            "calculate ",
            "",
            1
        )

        expression = expression.replace(
            "what is ",
            "",
            1
        )

        expression = expression.replace(
            "×",
            "*"
        )

        expression = expression.replace(
            "÷",
            "/"
        )

        allowed_characters = (
            "0123456789+-*/().% "
        )

        if all(
            character in allowed_characters
            for character in expression
        ):

            try:

                result = eval(
                    expression,
                    {
                        "__builtins__": {}
                    },
                    {}
                )

                return {
                    "success": True,
                    "action": "calculate",
                    "result": result,
                    "response":
                        f"The answer is {result}."
                }

            except Exception:
                pass


    # --------------------------------------------------------
    # AI FALLBACK
    # --------------------------------------------------------

    try:

        prompt = f"""
{SYSTEM_PROMPT}

You are handling an agent command.

USER COMMAND:
{request.command}

Determine the best action or response.

If the request requires an action that Avani
cannot currently perform, clearly explain that.

Do not pretend that an action was completed
unless the backend actually completed it.
"""

        response_text = generate_ai_response(
            prompt=prompt,
            model=OLLAMA_MODEL,
            timeout=120
        )

        return {
            "success": True,
            "action": "ai_response",
            "response": response_text
        }


    except Exception as error:

        return {
            "success": False,
            "response":
                "I couldn't process that command right now.",
            "error": str(error)
        }    