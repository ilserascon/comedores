import os
import jinja2
import pdfkit
import qrcode
from apps.home.models import Voucher, Lots



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

def prepare_qrs(vouchers:list[Voucher], lots_id:int, diningroom):
  QRS_PATH = os.path.abspath('./staticfiles/temp/')
  if not os.path.exists(QRS_PATH):
    os.makedirs(QRS_PATH)
  
  qr_paths = []
  for voucher in vouchers:
      voucher.folio = f'{lots_id}-{voucher.id}'
      filename = f'qr_{voucher.folio}.png'
      path = os.path.join(QRS_PATH, filename)
      qrcode.make(voucher.folio).save(path)
      qr_paths.append((path, voucher.folio, diningroom))
  
  return qr_paths

def create_pdf_name(lotId: int):
  return f'/LOT-{lotId}.pdf'

def get_pdf_path(lotId: int):
  filename = create_pdf_name(lotId)
  return OUTPUT_DIR+filename
  
def unique_vouchers_pdf_exists(lotId: int):
  filename = create_pdf_name(lotId)
  return os.path.exists(OUTPUT_DIR+filename)

def generate_lot_pdf(lot_id: int):
  if unique_vouchers_pdf_exists(lot_id):
    return get_pdf_path(lot_id)
  
  lot = Lots.objects.filter(id=lot_id).first()
  dining_room = lot.client_diner.dining_room.name

  vouchers = list(Voucher.objects.filter(id=lot_id))
  qr_paths = prepare_qrs(vouchers, lot_id, dining_room)
  filename = create_pdf_name(lot_id)
  generate_qrs_pdf(qr_paths, filename)

  for qr_path in qr_paths:
    os.remove(qr_path[0])
  
  return get_pdf_path(lot_id)

  
  
    