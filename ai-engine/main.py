import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
from typing import List

from fastapi import Body

@app.post("/verify-github-skills")
async def verify_github_skills(payload: dict = Body(...)):
    repos = payload.get("repo_data", [])
    if not repos:
        return {"skills": []}

    # System prompt for skill weighting
    system_prompt = """
    You are a Technical Lead. Analyze the following GitHub repository data.
    Determine the expertise level (0.1 to 1.0) for the primary languages mentioned.
    Boost scores if the repository has stars or a complex description.
    Output ONLY valid JSON: {"verified_skills": [{"skill": "string", "confidence": float, "reasoning": "string"}]}
    """

    try:
        # We send a summary of repos to Llama to get a weighted opinion
        repo_summary = "\n".join([
            f"Repo: {r.get('name')}, Lang: {r.get('language')}, Stars: {r.get('stargazers_count')}, Desc: {r.get('description')}" 
            for r in repos if r.get('language')
        ])

        response = ollama.chat(
            model='llama3.2:1b',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': f"Analyze these repos:\n{repo_summary}"}
            ],
            format='json'
        )

        result = json.loads(response['message']['content'])
        
        # Add the 'verified' tag and 'source' to each skill
        for skill in result.get("verified_skills", []):
            skill["verified"] = True
            skill["source"] = "github_ai"

        return result

    except Exception as e:
        print(f"Verification Error: {e}")
        return {"verified_skills": []}

app = FastAPI()

# Allow Next.js to talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Define the Input Structure ---
class ResumeInput(BaseModel):
    text: str

# --- The AI Endpoint ---
@app.post("/parse-resume")
async def parse_resume(data: ResumeInput):
    if not data.text or len(data.text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text is too short or empty.")

    # We must explicitly tell the open-source model exactly what JSON shape we want
    system_prompt = """
    You are an expert technical recruiter AI. Extract skills from the provided resume text.
    You MUST respond strictly in valid JSON format matching this exact schema:
    {
      "skills": [
        {
          "skill": "Name of the skill (e.g., React, Python, Leadership)",
          "confidence": A float between 0.1 and 1.0 based on expertise described,
          "source": "resume",
          "reasoning": "A 1-sentence explanation of why this score was given."
        }
      ]
    }
    """

    try:
        # Call the local Llama 3 model via Ollama
        response = ollama.chat(
            model='llama3.2', 
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': f"Extract skills from this resume:\n\n{data.text}"}
            ],
            format='json' # Forces the model to output valid JSON
        )

        # Parse the JSON string returned by Llama 3 into a Python dictionary
        result = json.loads(response['message']['content'])
        return result

    except json.JSONDecodeError:
        print("Failed to parse JSON from LLM response.")
        raise HTTPException(status_code=500, detail="AI returned malformed data.")
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        raise HTTPException(status_code=500, detail="AI engine failed to process the resume.")


# --- Define the Input Structure ---
class SyllabusInput(BaseModel):
    target_role: str
    current_skills: List[str]
    gaps_to_learn: List[str]

# --- The Syllabus Generator Endpoint ---
@app.post("/generate-syllabus")
async def generate_syllabus(data: SyllabusInput):
    if not data.gaps_to_learn:
        return {"message": "No gaps to learn! You are ready for the job."}

    system_prompt = f"""
    You are an expert technical mentor. The user wants to achieve the goal of: '{data.target_role}'.
    They already know: {', '.join(data.current_skills)}.
    They need to learn these missing skills: {', '.join(data.gaps_to_learn)}.
    
    Create a concise, highly personalized week-by-week study syllabus.
    You MUST respond strictly in valid JSON format matching this exact schema:
    {{
      "syllabus": [
        {{
          "week": 1,
          "focus": "Name of the skill or concept",
          "action_items": ["Actionable step 1", "Actionable step 2"],
          "estimated_hours": 10
        }}
      ]
    }}
    """

    try:
        response = ollama.chat(
            model='llama3.2', 
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': "Generate my syllabus."}
            ],
            format='json'
        )

        raw_content = response['message']['content'].strip()
        
        # LLMs love to wrap JSON in markdown blocks. This strips them out safely.
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]
        elif raw_content.startswith("```"):
            raw_content = raw_content[3:]
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]
            
        result = json.loads(raw_content.strip())
        return result

    except Exception as e:
        # If it still fails, let's grab EXACTLY what the AI tried to say so we can debug it
        raw_out = response['message']['content'] if 'response' in locals() else "No response generated."
        print(f"Crash Reason: {str(e)}\nRaw AI Output: {raw_out}")
        raise HTTPException(status_code=500, detail={
            "error": str(e), 
            "raw_output": raw_out
        })