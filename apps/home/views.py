# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django import template
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.template import loader
from django.urls import reverse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from .models import Client
from apps.authentication.models import CustomUser
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
import json
from django.db.models import Q
from django.db import IntegrityError

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

@csrf_exempt
def client_list(request):
    if request.method == 'GET':
        search_query = request.GET.get('search', '')
        clients = Client.objects.all().order_by('id').values('id', 'company', 'name', 'lastname', 'second_lastname', 'rfc', 'email', 'phone', 'address', 'status')

        if search_query:
            clients = clients.filter(
                Q(company__icontains=search_query) |
                Q(name__icontains=search_query) |
                Q(lastname__icontains=search_query) |
                Q(second_lastname__icontains=search_query)
            )

        page = request.GET.get('page', 1)
        paginator = Paginator(clients, 10)  # 10 clientes por página

        try:
            clients_page = paginator.page(page)
        except PageNotAnInteger:
            clients_page = paginator.page(1)
        except EmptyPage:
            clients_page = paginator.page(paginator.num_pages)

        return JsonResponse({
            'clients': list(clients_page),
            'page': clients_page.number,
            'pages': paginator.num_pages
        })
    elif request.method == 'POST':
        try:
            id_user = request.user.id
            if not CustomUser.objects.filter(id=id_user, role__name='Administrador').exists():
                return JsonResponse({'error': 'No tienes permiso para crear un cliente'}, status=403)
            data = json.loads(request.body)

            if len(data['company']) < 2:
                return JsonResponse({'error': 'El nombre de la compañía debe tener al menos 2 caracteres'}, status=400)
            
            if len(data['company']) > 50:
                return JsonResponse({'error': 'El nombre de la compañía debe tener máximo 50 caracteres'}, status=400)

            if len(data['name']) < 2 or len(data['lastname']) < 2 or len(data['second_lastname']) < 2:
                return JsonResponse({'error': 'El nombre y  los apellidos deben tener al menos 2 caracteres'}, status=400)
            
            if len(data['rfc']) != 12:
                return JsonResponse({'error': 'El RFC debe tener 12 caracteres'}, status=400)
            
            if len(data['phone']) != 10:
                return JsonResponse({'error': 'El teléfono debe tener 10 caracteres'}, status=400)
            
            if len(data['address']) < 5:
                return JsonResponse({'error': 'La dirección debe tener al menos 5 caracteres'}, status=400)
            
            if len(data['address']) > 100:
                return JsonResponse({'error': 'La dirección debe tener máximo 100 caracteres'}, status=400)
                        
            if '@' not in data['email'] or '.' not in data['email']:
                return JsonResponse({'error': 'Correo electrónico inválido'}, status=400)
            
            client = Client.objects.create(
                company=data['company'],
                name=data['name'],
                lastname=data['lastname'],
                second_lastname=data.get('second_lastname', ''),
                rfc=data['rfc'].upper(),
                email=data['email'],
                phone=data['phone'],
                address=data['address'],
                status=data.get('status', True),
                created_by=request.user
            )
            return JsonResponse({'message': 'Cliente creado correctamente', 'client_id': client.id}, status=201)
        except IntegrityError as e:
            if 'email' in str(e):
                return JsonResponse({'error': 'El correo electrónico ya existe'}, status=400)
            else:
                return JsonResponse({'error': 'Error de integridad de datos'}, status=400)
        except KeyError as e:
            return JsonResponse({'error': f'Campo faltante: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def client_detail(request, client_id):
    client = get_object_or_404(Client, id=client_id)
    if request.method == 'GET':
        try:
            client_data = Client.objects.filter(id=client_id).values('id', 'company', 'name', 'lastname', 'second_lastname', 'rfc', 'email', 'phone', 'address', 'status', 'created_by', 'updated_by').first()
            return JsonResponse(client_data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            if len(data['company']) < 2:
                return JsonResponse({'error': 'El nombre de la compañía debe tener al menos 2 caracteres'}, status=400)
            
            if len(data['company']) > 50:
                return JsonResponse({'error': 'El nombre de la compañía debe tener máximo 50 caracteres'}, status=400)

            if len(data['name']) < 2 or len(data['lastname']) < 2 or len(data['second_lastname']) < 2:
                return JsonResponse({'error': 'El nombre y  los apellidos deben tener al menos 2 caracteres'}, status=400)
            
            if len(data['rfc']) != 13:
                return JsonResponse({'error': 'El RFC debe tener 13 caracteres'}, status=400)
            
            if len(data['phone']) != 10:
                return JsonResponse({'error': 'El teléfono debe tener 10 caracteres'}, status=400)
            
            if len(data['address']) < 5:
                return JsonResponse({'error': 'La dirección debe tener al menos 5 caracteres'}, status=400)
            
            if len(data['address']) > 100:
                return JsonResponse({'error': 'La dirección debe tener máximo 100 caracteres'}, status=400)
                        
            if '@' not in data['email'] or '.' not in data['email']:
                return JsonResponse({'error': 'Correo electrónico inválido'}, status=400)
            
            client.company = data.get('company', client.company)
            client.name = data.get('name', client.name)
            client.lastname = data.get('lastname', client.lastname)
            client.second_lastname = data.get('second_lastname', client.second_lastname)
            client.rfc = data.get('rfc', client.rfc).upper()
            client.email = data.get('email', client.email)
            client.phone = data.get('phone', client.phone)
            client.address = data.get('address', client.address)
            client.status = data.get('status', client.status)
            client.save()
            return JsonResponse({'message': 'Cliente actualizado correctamente'})
        except IntegrityError as e:
            if 'email' in str(e):
                return JsonResponse({'error': 'El correo electrónico ya existe'}, status=400)
            else:
                return JsonResponse({'error': 'Error de integridad de datos'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)