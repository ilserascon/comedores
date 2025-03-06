# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django import template
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.template import loader
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.core.paginator import Paginator
from .models import Employee, PayrollType, Client
import json
import pandas as pd


@login_required(login_url="/login/")
def index(request):
    context = {'segment': 'index'}

    html_template = loader.get_template('home/index.html')
    return HttpResponse(html_template.render(context, request))


@login_required(login_url="/login/")
def pages(request):
    context = {}
    # All resource paths end in .html.
    # Pick out the html file name from the url. And load that template.
    try:

        load_template = request.path.split('/')[-1]

        if load_template == 'admin':
            return HttpResponseRedirect(reverse('admin:index'))
        context['segment'] = load_template

        html_template = loader.get_template('home/' + load_template)
        return HttpResponse(html_template.render(context, request))

    except template.TemplateDoesNotExist:

        html_template = loader.get_template('home/page-404.html')
        return HttpResponse(html_template.render(context, request))

    except:
        html_template = loader.get_template('home/page-500.html')
        return HttpResponse(html_template.render(context, request))


# ===================== EMPLEADOS ===================== #
@csrf_exempt
def get_empleados(request):
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    
    empleados = Employee.objects.all().values(
        'id', 'employeed_code', 'name', 'lastname', 'second_lastname', 'email', 'phone', 'client__company', 'payroll__description', 'status'
    )
    
    paginator = Paginator(empleados, page_size)
    page_obj = paginator.get_page(page_number)
    
    response = {
        'empleados': list(page_obj),
        'total_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'has_previous': page_obj.has_previous(),
        'has_next': page_obj.has_next(),
    }
    
    return JsonResponse(response)
    

@csrf_exempt
def get_empleado(request):
    try:
        empleado_id = request.GET.get('empleado_id')
        
        # Realizar la consulta con las uniones necesarias
        empleado = Employee.objects.filter(id=empleado_id).select_related('payroll', 'client').values(
            'id',
            'employeed_code',
            'name',
            'lastname',
            'second_lastname',
            'email',
            'phone',
            'client__company',
            'client_id',
            'payroll__description',
            'payroll_id',
            'status'
        ).first()

        if not empleado:
            return JsonResponse({'error': 'Empleado no encontrado'}, status=404)

        client = {
            'id': empleado['client_id'],
            'company': empleado['client__company']
        }

        payroll = {
            'id': empleado['payroll_id'],
            'description': empleado['payroll__description']
        }

        context = {
            'id': empleado['id'],
            'employeed_code': empleado['employeed_code'],
            'name': empleado['name'],
            'lastname': empleado['lastname'],
            'second_lastname': empleado['second_lastname'],
            'email': empleado['email'],
            'phone': empleado['phone'],
            'client': client,
            'payroll': payroll,
            'status': empleado['status']
        }        

        return JsonResponse(context)
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        print(f"Error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def create_empleado(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Crear un nuevo empleado
            empleado = Employee(
                employeed_code=data.get('employeed_code'),
                name=data.get('name'),
                lastname=data.get('lastname'),
                second_lastname=data.get('second_lastname'),
                email=data.get('email'),
                phone=data.get('phone'),
                client_id=data.get('client_id'),
                payroll_id=data.get('payroll_id'),
                status=data.get('status'),
                created_by_id=request.user.id
            )
            
            # Guardar el nuevo empleado
            empleado.save()
            
            return JsonResponse({'message': 'Empleado creado correctamente'})
        except Exception as e:
            print(f"Error: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)


@csrf_exempt
def update_empleado(request):

    try:
        data = json.loads(request.body)
        empleado_id = data.get('id')
        
        # Obtener el empleado existente
        empleado = Employee.objects.get(id=empleado_id)
        
        # Actualizar los campos del empleado
        empleado.employeed_code = data.get('employeed_code', empleado.employeed_code)
        empleado.name = data.get('name', empleado.name)
        empleado.lastname = data.get('lastname', empleado.lastname)
        empleado.second_lastname = data.get('second_lastname', empleado.second_lastname)
        empleado.email = data.get('email', empleado.email)
        empleado.phone = data.get('phone', empleado.phone)
        empleado.client_id = data.get('client_id', empleado.client_id)
        empleado.payroll_id = data.get('payroll_id', empleado.payroll_id)
        empleado.status = data.get('status', empleado.status)
        
        # Guardar los cambios
        empleado.save()
        
        return JsonResponse({'message': 'Empleado actualizado correctamente'})
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        print(f"Error: {e}")
        return JsonResponse({'error': str(e)}, status=500)


# ===================== ARCHIVO EXCEL ===================== #
@csrf_exempt
def upload_empleados(request):
    try:
        data = json.loads(request.body)
        df = pd.DataFrame(data)

        # Procesar los datos del DataFrame y guardarlos en la base de datos
        for index, row in df.iterrows():
            client = Client.objects.get(id=4)  # Asumiendo que todos los empleados cargados pertenecen a DHL
            payroll = PayrollType.objects.get(description=row['NOMINA'])

            Employee.objects.update_or_create(
                employeed_code=row['NO. EMPLEADO'],
                defaults={
                    'name': row['NOMBRES'],
                    'lastname': row['APELLIDO PATERNO'],
                    'second_lastname': row['APELLIDO MATERNO'],
                    'payroll': payroll,
                    'email': row.get('CORREO', ''),  # Usar el valor del Excel o vacío si no existe
                    'phone': row.get('TELEFONO', ''),  # Usar el valor del Excel o vacío si no existe
                    'client': client,
                    'status': True,  # Asumiendo que todos los empleados cargados están activos
                    'created_by_id': request.user.id
                }
            )

        return JsonResponse({'message': 'Empleados cargados correctamente'}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
        
# ===================== TIPOS DE NOMINA ===================== #
@csrf_exempt
def get_tipos_nomina(request):
    try:
        tipos_nomina = PayrollType.objects.all().values('id', 'description')
        context = {
            'tipos_nomina': list(tipos_nomina)
        }
        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ===================== CLIENTES ===================== #
@csrf_exempt
def get_clientes(request):
    try:
        clientes = Client.objects.all().values('id', 'company')
        context = {
            'clientes': list(clientes)
        }        
        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)