import os
import jinja2
import pdfkit
import qrcode
from apps.home.models import Voucher, Lots
import datetime



CSS_DIR = os.path.abspath('./apps/static/assets/css/pdf_generation/')
TEMPLATES_DIR = os.path.abspath('./apps/templates/pdf_generation/')
OUTPUT_DIR = os.path.abspath('./apps/static/pdfs/')
QRS_PATH = os.path.abspath('./apps/static/assets/.temp/qrs/')


if not os.path.exists(CSS_DIR):
    os.makedirs(CSS_DIR)

if not os.path.exists(TEMPLATES_DIR):
    os.makedirs(TEMPLATES_DIR)

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

if not os.path.exists(QRS_PATH):
    os.makedirs(QRS_PATH)



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
QR_CODE_PERPETUAL_TEMPLATE = 'qr-code-perpetual-template.html'
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

def prepare_qr(voucher: Voucher):
  filename = os.path.join(QRS_PATH, f'qr_{voucher.folio}.png')
  qrcode.make(voucher.folio).save(filename)
  
  return filename

def generate_perpetual_voucher_pdf(voucher: Voucher, qr_path: str):
  
  filename = OUTPUT_DIR+f'/qr_{voucher.folio}.pdf'
  
  dining_room = voucher.lots.client_diner.dining_room.name
  rendered_template = jinja_env.get_template(QR_CODE_PERPETUAL_TEMPLATE).render({"logo_path": LOGO_PATH, "folio": voucher.folio, "employee": voucher.employee, "qr_path":qr_path, "comedor": dining_room})
  
  pdfkit.from_string(
    rendered_template,
    filename,
    options={"enable-local-file-access":""},
    css=QR_CODES_STYLESHEET,
    configuration=wkconfig
  )
  return filename

def verify_lot_pdf_exists(lot_id: int):
  filename = OUTPUT_DIR + f'/LOT-{lot_id}.pdf'

  if os.path.exists(filename):
    return filename
  
  return None

def verify_voucher_pdf_exists(voucher_folio: str):
  filename = OUTPUT_DIR + f'/qr_{voucher_folio}.pdf'

  if os.path.exists(filename):
    return filename
  
  return None
  
def prepare_qrs(vouchers:list[Voucher], lots_id:int, diningroom):

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

def create_lot_pdf_name(lotId: int):
  return f'/LOT-{lotId}.pdf'

def create_voucher_pdf_name(voucher_folio: str):
  return f'/qr_{voucher_folio}.pdf'

def get_lot_pdf_path(lotId: int):
  filename = create_lot_pdf_name(lotId)
  return OUTPUT_DIR+filename
  
def unique_vouchers_pdf_exists(lotId: int):
  filename = create_lot_pdf_name(lotId)
  return os.path.exists(OUTPUT_DIR+filename)

def generate_lot_pdf(lot_id: int):
  clean_temp_dir()
  if unique_vouchers_pdf_exists(lot_id):
    return get_lot_pdf_path(lot_id)
  
  lot = Lots.objects.filter(id=lot_id).first()
  dining_room = lot.client_diner.dining_room.name

  vouchers = list(Voucher.objects.filter(id=lot_id))
  qr_paths = prepare_qrs(vouchers, lot_id, dining_room)
  filename = create_lot_pdf_name(lot_id)
  generate_qrs_pdf(qr_paths, filename)

  for qr_path in qr_paths:
    os.remove(qr_path[0])
  
  return get_lot_pdf_path(lot_id)

  
def clean_pdf_dir():
  LIMIT_DAYS = 30

  for filename in os.listdir(OUTPUT_DIR):
    if filename.endswith('.pdf'):
      file_path = os.path.join(OUTPUT_DIR, filename)
      creation_time = os.path.getctime(file_path)
      current_time = datetime.datetime.now()
      time_difference = current_time - datetime.datetime.fromtimestamp(creation_time)
      if time_difference.days  > LIMIT_DAYS:
        os.remove(file_path)


def clean_temp_dir():
  LIMIT_DAYS = 5
  
  for filename in os.listdir(QRS_PATH):
    if filename.endswith('.png'):
      file_path = os.path.join(QRS_PATH, filename)
      creation_time = os.path.getctime(file_path)
      current_time = datetime.datetime.now()
      time_difference = current_time - datetime.datetime.fromtimestamp(creation_time)
      if time_difference.days  > LIMIT_DAYS:
        os.remove(file_path)

def prepare_url_pdf(complete_url: str):
  #conseguir la url hasta el penultimo /
  url = complete_url.split('/')
  url = url[-3:]
  url = '/'.join(url)
  return url