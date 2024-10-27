from flask import Flask, request, jsonify, render_template, send_file
import os
from dotenv import load_dotenv
import google.generativeai as genai
import PyPDF2 as pdf
import spacy
from fpdf import FPDF
import re

# Load environment variables
load_dotenv()
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
# Configure Google Generative AI with the API key
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
nlp = spacy.load("en_core_web_sm")

def input_pdf_text(uploaded_file):
    reader = pdf.PdfReader(uploaded_file)
    text = ""
    for page_n in range(len(reader.pages)):
        page = reader.pages[page_n]
        text += str(page.extract_text())
    
    return text


def ai_check(input):
    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(input)
    return response.text

screening_prompt = """ Hello. Act like a skilled or very experienced ATS (Application Tracking System)
with a deep understanding of the field speicified by the job description. Your task is to evaluate the resume based on the given job description.
You must consider the job market is very competitive and you should provide best assistance
for improving the resumes. Assign the percentage matching based on job desciription
and the missing keywords with high accuracy. Format your output in bullet points like so:
[insert percent here]% (The first line should be just the Job Description Compatability Score, not bolded or italicized or formatted)
Missing Qualifications: 
Missing Keywords: 
Strengths: 
Weaknesses: """

fact_check_prompt = """Hello. act like an investigator with access to the internet and specific search results.
Your task is to verify things on the resume that you can verify via the internet. 
Determine whether or not the applicant is a liar or fraud. This includes company or club positions, education, etc. Format the output in bullet points like so: 
[insert percent here]% (The first line should be just the Resume Validity Score, not bolded or italicized or formatted) 
Verifiable: (end each bullet point with how you verified it)
Not Verifiable: """

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/applicants')
def applicants():
    return render_template('applicants.html')

@app.route('/process_resume', methods=['POST'])
def process_resume():
    try:
        applicant_name = request.form.get('applicantName')
        uploaded_file = request.files.get('applicantResume')
        job_description = request.form.get('jobDescription')

        resume_text = input_pdf_text(uploaded_file)

        screening_response = ai_check([screening_prompt, "Job Description\n" + job_description, "Resume \n" + resume_text])
        fact_check_response = ai_check([fact_check_prompt, "Resume \n" + resume_text])


        # Extract numeric scores from responses
        job_match_score = re.search(r'(\d+)%', screening_response)
        fact_check_score = re.search(r'(\d+)%', fact_check_response)


        # Prepare response data
        return jsonify({
            "name": applicant_name,
            "job_match_score": job_match_score.group(),
            "fact_check_response": fact_check_score.group(),
            "match_details": screening_response,
            "check_details": fact_check_response,
            "status": "success"
        })
    except Exception as e:
        print(f"Error processing resume: {e}")
        return jsonify({"status": "error", "message": str(e)})

@app.route('/create_pdf', methods=['GET'])
def create_pdf():
    # Get parameters from the request (e.g., score, details)
    score = request.args.get('score')
    details = request.args.get('details')
    applicant_name = request.args.get('name')
    
    # Create PDF content
    pdf_content = f"Applicant: {applicant_name}\n\nScore: {score}\n\nDetails:\n{details}"
    
    # Generate PDF
    pdf_filename = f"{applicant_name.replace(' ', '_')}_details.pdf"
    create_pdf_file(pdf_content, pdf_filename)
    
    # Return the PDF file
    return send_file(pdf_filename, as_attachment=True)

def create_pdf_file(content, filename):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    for line in content.split('\n'):
        pdf.multi_cell(0, 10, line)

    pdf.output(filename)

if __name__ == '__main__':
    app.run(debug=True)