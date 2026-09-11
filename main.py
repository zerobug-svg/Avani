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

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "llama3.2:3b"

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

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
        # Send results to local Ollama
        # -------------------------------------------------

        ollama_response = requests.post(

            OLLAMA_URL,

            json={

                "model":
                    MODEL,

                "prompt":
                    web_prompt,

                "stream":
                    False

            },

            timeout=120
        )


        # -------------------------------------------------
        # Check Ollama
        # -------------------------------------------------

        if not ollama_response.ok:

            return {

                "success": False,

                "response":
                    "I found web results, but I couldn't process them with my local AI."
            }


        data = (
            ollama_response.json()
        )


        response_text = (
            data.get(
                "response",
                ""
            )
            .strip()
        )


        if not response_text:

            response_text = (
                "I found web results, but I couldn't generate an answer."
            )


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

        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )

        response.raise_for_status()

        data = response.json()

        ai_response = data.get(
            "response",
            ""
        ).strip()

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
                "I couldn't communicate with Ollama. "
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

    ollama_status = "Disconnected"

    try:

        response = requests.get(
            "http://127.0.0.1:11434/api/tags",
            timeout=3
        )

        if response.ok:

            ollama_status = "Connected"


    except Exception:

        ollama_status = "Disconnected"


    return {
        "status": "online",
        "assistant": "Avani",
        "owner": "Prasanna",
        "ollama": ollama_status,
        "model": MODEL
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

                # Read image as binary data
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


                # -------------------------------------------------
                # Create image-aware prompt
                # -------------------------------------------------

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


                # -------------------------------------------------
                # Send image to Gemma 3 Vision
                # -------------------------------------------------

                ollama_response = requests.post(

                    OLLAMA_URL,

                    json={
                        "model": "gemma3:4b",
                        "prompt": image_prompt,
                        "images": [
                            image_base64
                        ],
                        "stream": False
                    },

                    timeout=180
                )


                # -------------------------------------------------
                # Check Ollama response
                # -------------------------------------------------

                if not ollama_response.ok:

                    return {
                        "success": False,
                        "response":
                            "Gemma could not analyze the image."
                    }


                result = (
                    ollama_response.json()
                )


                response_text = (
                    result.get(
                        "response",
                        ""
                    )
                    .strip()
                )


                if not response_text:

                    response_text = (
                        "I couldn't generate an answer "
                        "from the image."
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
                    "IMAGE CHAT ERROR:",
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
        # Protect Ollama from extremely large documents
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
            "provided by the user.\n\n"

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
            "the document content above. "

            "If the answer is not present in "
            "the document, clearly say that "
            "the information is not available "
            "in the document. "

            "Do not invent information."
        )


        # -------------------------------------------------
        # Send document to Ollama
        # -------------------------------------------------

        ollama_response = requests.post(

            OLLAMA_URL,

            json={
                "model": "llama3.2:3b",
                "prompt": file_prompt,
                "stream": False
            },

            timeout=180
        )


        # -------------------------------------------------
        # Check Ollama response
        # -------------------------------------------------

        if not ollama_response.ok:

            return {
                "success": False,
                "response":
                    "Ollama could not process the document."
            }


        result = (
            ollama_response.json()
        )


        response_text = (
            result.get(
                "response",
                ""
            )
            .strip()
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