import os
import jinja2
import pdfkit

CSS_DIR = os.path.abspath('./apps/static/assets/css/pdf_generation/')
TEMPLATES_DIR = os.path.abspath('./apps/templates/pdf_generation/')
OUTPUT_DIR = os.path.abspath('./apps/static/pdfs/')

if not os.path.exists(CSS_DIR):
    os.makedirs(CSS_DIR)

if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)


def _get_path_to_wkhtmltopdf():
  if os.name == 'nt':
    return r'C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe'
  elif os.name == 'posix':
    return r'/usr/bin/wkhtmltopdf'
  
wkconfig = pdfkit.configuration(wkhtmltopdf=_get_path_to_wkhtmltopdf())


jinja_env = jinja2.Environment(
    loader=jinja2.FileSystemLoader(TEMPLATES_DIR)
)

QR_CODES_TEMPLATE = 'qr-codes-template.html'
QR_CODES_STYLESHEET = CSS_DIR+'/generated-qr-styles.css'
LOGO_PATH = os.path.abspath('./apps/static/assets/img/brand/logo_alcorp.jpg')

def generate_qrs_pdf(qrs: list[str], filename: str):
  filename = OUTPUT_DIR+filename
  rendered_template = jinja_env.get_template(QR_CODES_TEMPLATE).render({"qrcodes":qrs, "logo_path":LOGO_PATH})
  pdfkit.from_string(
    rendered_template,
    filename,
    options={"enable-local-file-access":""},
    css=QR_CODES_STYLESHEET,
    configuration=wkconfig
  )
  
  return filename
    
    