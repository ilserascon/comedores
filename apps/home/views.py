# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""
from datetime import datetime
from django import template
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse, HttpResponseForbidden
from django.shortcuts import render
from django.template import loader
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from decouple import config
from django.db import models

from .models import  VoucherType, Lots, DiningRoom, ClientDiner, Client, Employee, PayrollType, Entry, EmployeeClientDiner, Voucher
from apps.authentication.models import CustomUser, Role
from django.db.models import Q, F, Count, Exists, OuterRef
from django.db import IntegrityError, transaction
import json
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from .transactions.clients import change_client_status
import pandas as pd
from .admin import admin_views, user_views
import os
from email.message import EmailMessage
import ssl
import smtplib
from apps.pdf_generation import generate_qrs_pdf, prepare_qrs, generate_lot_pdf, clean_pdf_dir

@login_required(login_url="/login/")
def index(request):
    context = {'segment': 'index'}

    html_template = loader.get_template('home/index.html')
    return HttpResponse(html_template.render(context, request))


@login_required(login_url="/login/")
def pages(request):
    
    context = {'segment': request.path.split('/')[-1]}
    # All resource paths end in .html.
    # Pick out the html file name from the url. And load that template.
    try:

        load_template = request.path.split('/')[-1]

        if load_template in map(lambda x: x + '.html', admin_views) and request.user.role_id != 1:
           response = render(request, 'home/page-403.html') 
           return HttpResponseForbidden(response.content)

        if load_template in map(lambda x: x + '.html', user_views) and request.user.role_id != 2:
            response = render(request, 'home/page-403.html')
            return HttpResponseForbidden(response.content)

        if 'reporte' in load_template and request.user.role_id == 1:
            html_template = loader.get_template('home/reportes/' + load_template)
        else:
            html_template = loader.get_template('home/' + load_template)
        
        return HttpResponse(html_template.render(context, request))

    except template.TemplateDoesNotExist:
        html_template = loader.get_template('home/page-404.html')
        return HttpResponse(html_template.render(context, request))

    except:
        html_template = loader.get_template('home/page-500.html')
        return HttpResponse(html_template.render(context, request))

# ============================= COMEDORES =============================
@csrf_exempt
def get_all_comedores(request):
    try:
        # Obtener el valor del filtro de la solicitud
        client_value = request.GET.get('client-id', 'all')

        # Obtener todos los comedores con la información del cliente y del encargado
        dining_rooms_query = ClientDiner.objects.select_related('client', 'dining_room', 'dining_room__in_charge').values(
            'client__company',
            'dining_room__id',
            'dining_room__name',
            'dining_room__description',
            'dining_room__in_charge__first_name',
            'dining_room__in_charge__last_name',
            'dining_room__status'
        ).distinct()

        # Aplicar el filtro si no es 'all'
        if client_value != 'all':
            dining_rooms_query = dining_rooms_query.filter(client__id=client_value)

        # Renombrar campos para evitar confusión
        dining_rooms_list = [
            {
                'company': dr['client__company'],
                'id': dr['dining_room__id'],
                'name': dr['dining_room__name'],
                'description': dr['dining_room__description'],
                'in_charge_first_name': dr['dining_room__in_charge__first_name'],
                'in_charge_last_name': dr['dining_room__in_charge__last_name'],
                'status': dr['dining_room__status']
            }
            for dr in dining_rooms_query
        ]


        return JsonResponse({"comedores": dining_rooms_list})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

@csrf_exempt
def get_comedores(request):
    try:
        # Obtener el valor del filtro de la solicitud
        filter_value = request.GET.get('filter', 'all')

        # Obtener todos los comedores con la información del cliente y del encargado
        dining_rooms_query = ClientDiner.objects.select_related('client', 'dining_room', 'dining_room__in_charge').values(
            'client__company',
            'dining_room__id',
            'dining_room__name',
            'dining_room__description',
            'dining_room__in_charge__first_name',
            'dining_room__in_charge__last_name',
            'dining_room__status'
        ).distinct()

        # Aplicar el filtro si no es 'all'
        if filter_value != 'all':
            dining_rooms_query = dining_rooms_query.filter(client__id=filter_value)

        # Renombrar campos para evitar confusión
        dining_rooms_list = [
            {
                'company': dr['client__company'],
                'id': dr['dining_room__id'],
                'name': dr['dining_room__name'],
                'description': dr['dining_room__description'],
                'in_charge_first_name': dr['dining_room__in_charge__first_name'],
                'in_charge_last_name': dr['dining_room__in_charge__last_name'],
                'status': dr['dining_room__status']
            }
            for dr in dining_rooms_query
        ]

        # Obtener lista de clientes únicos
        clients = Client.objects.values('id', 'company').distinct()

        # Paginación
        page_number = request.GET.get('page', 1)
        paginator = Paginator(dining_rooms_list, 10)  # 10 comedores por página
        page_obj = paginator.get_page(page_number)

        context = {
            'dining_rooms': list(page_obj),
            'clients': list(clients),
            'page_number': page_obj.number,
            'num_pages': paginator.num_pages,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_comedor(request):
    try:
        dining_room_id = request.GET.get('dining_room_id')

        # Realizar la consulta con las uniones necesarias
        dining_room = DiningRoom.objects.filter(id=dining_room_id).select_related('in_charge').prefetch_related('client_diner_dining_room__client').values(
            'id', 'name', 'description', 'status', 'in_charge__first_name', 'in_charge__last_name', 'in_charge_id',
            'client_diner_dining_room__client__id', 'client_diner_dining_room__client__company'
        ).first()

        if not dining_room:
            return JsonResponse({'error': 'Comedor no encontrado'}, status=404)

        in_charge = {
            'id': dining_room['in_charge_id'],
            'first_name': dining_room['in_charge__first_name'],
            'last_name': dining_room['in_charge__last_name']
        }

        client = {
            'id': dining_room['client_diner_dining_room__client__id'],
            'company': dining_room['client_diner_dining_room__client__company']
        }

        context = {
            'dining_room_id': dining_room['id'],
            'name': dining_room['name'],
            'description': dining_room['description'],
            'status': dining_room['status'],
            'in_charge': in_charge,
            'client': client
        }

        return JsonResponse(context)
    except DiningRoom.DoesNotExist:
        return JsonResponse({'error': 'Comedor no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def create_comedor(request):
    try:
        data = json.loads(request.body)
        name = data.get('name')
        description = data.get('description')
        status = data.get('status')
        in_charge = data.get('in_charge')
        client_id = data.get('client')  # Obtener el client_id del request
        created_by_id = request.user.id

        if not client_id:
            return JsonResponse({'error': 'El campo client es obligatorio'}, status=400)

        # Crear el comedor en el modelo DiningRoom
        dining_room = DiningRoom(
            name=name,
            description=description,
            status=status,
            in_charge_id=in_charge if in_charge else None,
            created_by_id=created_by_id,
            updated_by_id=created_by_id
        )

        if len(dining_room.description) > 100:
            return JsonResponse({'error': 'La descripción no puede tener más de 100 caracteres'}, status=400)

        dining_room.save()

        # Crear la entrada en el modelo ClientDiner
        client_diner = ClientDiner(
            dining_room_id=dining_room.id,
            client_id=client_id,
            created_by_id=created_by_id,
            updated_by_id=request.user.id
        )
        client_diner.save()

        return JsonResponse({'message': 'Comedor creado correctamente'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def update_comedor(request):
    try:
        user_id = request.user.id
        data = json.loads(request.body)
        dining_room_id = data.get('dining_room_id')
        name = data.get('name')
        description = data.get('description')
        status = data.get('status')
        in_charge = data.get('inCharge')
        client_id = data.get('client')  # Obtener el client_id del request

        dining_room = DiningRoom.objects.get(id=dining_room_id)
        dining_room.name = name
        dining_room.description = description
        dining_room.status = status

        if len(dining_room.description) > 100:
            return JsonResponse({'error': 'La descripción no puede tener más de 100 caracteres'}, status=400)

        # Permitir que in_charge sea nulo
        dining_room.in_charge_id = in_charge if in_charge else None        

        dining_room.save()

        # Actualizar la entrada en el modelo ClientDiner
        client_diner, created = ClientDiner.objects.update_or_create(
            dining_room_id=dining_room_id,
            defaults={'client_id': client_id},
            updated_by_id=user_id
        )

        return JsonResponse({'message': 'Comedor actualizado correctamente'})
    except DiningRoom.DoesNotExist:
        return JsonResponse({'error': 'Comedor no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_encargados(request):
    try:
        # Filtrar los usuarios con role_id = 2
        encargados = CustomUser.objects.filter(role_id=2)
        
        # Excluir los usuarios que están asignados como in_charge en cualquier DiningRoom
        encargados = encargados.exclude(dining_room_in_charge__isnull=False)
        
        # Seleccionar los campos necesarios
        encargados = encargados.values('id', 'first_name', 'last_name')
        
        context = {
            'encargados': list(encargados)
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

# Obtiente los clientes que tienen algun comedor asignado (select del filtro)   
def get_clientes_comedores(request):
    try:
        # Obtener los clientes que tienen comedores asignados
        clientes = ClientDiner.objects.select_related('client').values('client__id', 'client__company').distinct()
        
        # Formatear los datos para la respuesta JSON
        clientes_list = [
            {
                'id': cliente['client__id'],
                'company': cliente['client__company']
            }
            for cliente in clientes
        ]
        
        context = {
            'clientes': clientes_list
        }
        
        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
        
# ================================== Clientes ================================== #
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

            if len(data['name']) < 2 or len(data['lastname']) < 2:
                return JsonResponse({'error': 'El nombre y apellido paterno deben tener al menos 2 caracteres'}, status=400)
            
            if len(data['rfc']) != 13:
                return JsonResponse({'error': 'El RFC debe tener 13 caracteres'}, status=400)
            
            try:
                int(data['phone'])
            except ValueError:
                if not data['phone'].isdigit():
                    return JsonResponse({'error': 'El teléfono debe contener solo dígitos'}, status=400)
            
            if len(data['phone']) != 10:
                return JsonResponse({'error': 'El teléfono debe tener 10 dígitos'}, status=400)
            
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
                created_by=request.user,
                updated_by_id=request.user.id
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

            if len(data['name']) < 2 or len(data['lastname']) < 2:
                return JsonResponse({'error': 'El nombre y apellido paterno deben tener al menos 2 caracteres'}, status=400)
            
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
            
            user_who_updated = CustomUser.objects.filter(id=request.user.id).first()
            if user_who_updated is None:
                return JsonResponse({'error': 'Usuario no encontrado'})
            
            if client.status != data['status']:
                change_client_status(user_who_updated, client, data['status'])
            
            client.updated_by = user_who_updated
            client.save()
            return JsonResponse({'message': 'Cliente actualizado correctamente'})
        except IntegrityError as e:
            if 'email' in str(e):
                return JsonResponse({'error': 'El correo electrónico ya existe'}, status=400)
            else:
                return JsonResponse({'error': 'Error de integridad de datos'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        
# ================================== Usuarios ================================== #
@csrf_exempt
def user_list(request):
    if request.method == 'GET':
        search_query = request.GET.get('search', '')
        role_filter = request.GET.get('role', '')

        users = CustomUser.objects.all().order_by('id').values(
            'id', 'username', 'first_name', 'last_name', 'second_last_name', 'email', 'role__name', 'dining_room_in_charge__name', 'status'
        ).distinct()

        if search_query:
            users = users.filter(
                Q(username__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(second_last_name__icontains=search_query)
            )

        if role_filter:
            users = users.filter(role__id=role_filter)

        page = request.GET.get('page', 1)
        paginator = Paginator(users, 10)  # 10 usuarios por página

        try:
            users_page = paginator.page(page)
        except PageNotAnInteger:
            users_page = paginator.page(1)
        except EmptyPage:
            users_page = paginator.page(paginator.num_pages)

        return JsonResponse({
            'users': list(users_page),
            'page': users_page.number,
            'pages': paginator.num_pages
        })
    elif request.method == 'POST':
        try:
            id_user = request.user.id
            if not CustomUser.objects.filter(id=id_user, role__name='Administrador').exists():
                return JsonResponse({'error': 'No tienes permiso para crear un usuario'}, status=403)
            data = json.loads(request.body)
            role = get_object_or_404(Role, id=data['role_id'])

            if len(data['username']) < 5:
                return JsonResponse({'error': 'El nombre de usuario debe tener al menos 5 caracteres'}, status=400)

            if len(data['first_name']) < 2 or len(data['last_name']) < 2:
                return JsonResponse({'error': 'El nombre y apellido paterno deben tener al menos 2 caracteres'}, status=400)
                        
            if 'email' in data and data['email']:
                if '@' not in data['email'] or '.' not in data['email']:
                    return JsonResponse({'error': 'Correo electrónico inválido'}, status=400)
            
            if len(data['password']) < 8 or not any(char.isdigit() for char in data['password']) or not any(char.isalpha() for char in data['password']):
                return JsonResponse({'error': 'La contraseña debe tener al menos 8 caracteres, una letra y un número'}, status=400)

            with transaction.atomic():
                user = CustomUser.objects.create(
                    username=data['username'],
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    second_last_name=data['second_last_name'],
                    email=data.get('email', ''),
                    password=make_password(data['password']),
                    role=role,
                    status=data.get('status', True),
                    created_by=request.user
                )
                if 'dining_room_in_charge' in data and data['dining_room_in_charge'] is not None:
                    if data['dining_room_in_charge'] == 'null' or data['dining_room_in_charge'] == 'no':
                        if user.dining_room_in_charge.exists():
                            dining_room = user.dining_room_in_charge.first()
                            dining_room.in_charge = None
                            dining_room.save()
                        user.dining_room_in_charge.clear()
                    else:
                        dining_room = get_object_or_404(DiningRoom, id=data['dining_room_in_charge'])
                        dining_room.in_charge = user
                        dining_room.save()
                        user.dining_room_in_charge.set([dining_room])

                if data['status'] == False:
                    dining_rooms = DiningRoom.objects.filter(in_charge=user)
                    for dining_room in dining_rooms:
                        dining_room.in_charge = None
                        dining_room.save()
                        user.dining_room_in_charge.clear()
                user.save()

            return JsonResponse({'message': 'Usuario creado correctamente', 'user_id': user.id}, status=201)
        except IntegrityError as e:
            if 'username' in str(e):
                return JsonResponse({'error': 'El nombre de usuario ya existe'}, status=400)
            elif 'email' in str(e):
                return JsonResponse({'error': 'El correo electrónico ya existe'}, status=400)
            else:
                return JsonResponse({'error': 'Error de integridad de datos'}, status=400)
        except KeyError as e:
            return JsonResponse({'error': f'Campo faltante: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def user_detail(request, user_id):
    user = get_object_or_404(CustomUser, id=user_id)
    if request.method == 'GET':
        try:
            user_data = CustomUser.objects.filter(id=user_id).values('id', 'username', 'first_name', 'last_name', 'second_last_name', 'email', 'role', 'role__name', 'dining_room_in_charge','dining_room_in_charge__name','status', 'created_by', 'updated_by').first()
            return JsonResponse(user_data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)

            if len(data['username']) < 5:
                return JsonResponse({'error': 'El nombre de usuario debe tener al menos 5 caracteres'}, status=400)
            
            if len(data['first_name']) < 2 or len(data['last_name']) < 2:
                return JsonResponse({'error': 'El nombre y apellido paterno deben tener al menos 2 caracteres'}, status=400)
            
            if 'email' in data and data['email']:
                if '@' not in data['email'] or '.' not in data['email']:
                    return JsonResponse({'error': 'Correo electrónico inválido'}, status=400)
            
            if 'password' in data and data['password'] is not None:
                if len(data['password']) < 8 or not any(char.isdigit() for char in data['password']) or not any(char.isalpha() for char in data['password']):
                    return JsonResponse({'error': 'La contraseña debe tener al menos 8 caracteres, una letra y un número'}, status=400)
                user.password = make_password(data['password'])

            with transaction.atomic():
                user.username = data.get('username', user.username)
                user.email = data.get('email', user.email)
                user.first_name = data.get('first_name', user.first_name)
                user.last_name = data.get('last_name', user.last_name)
                user.second_last_name = data.get('second_last_name', user.second_last_name)
                user.status = data.get('status', user.status)
                if 'role_id' in data:
                    user.role = get_object_or_404(Role, id=data['role_id'])
                user.save()

                if 'dining_room_in_charge' in data and data['dining_room_in_charge'] is not None:
                    if data['dining_room_in_charge'] == 'null' or data['dining_room_in_charge'] == 'no':
                        if user.dining_room_in_charge.exists():
                            dining_room = user.dining_room_in_charge.first()
                            dining_room.in_charge = None
                            dining_room.save()
                        user.dining_room_in_charge.clear()
                    else:
                        dining_room = get_object_or_404(DiningRoom, id=data['dining_room_in_charge'])
                        dining_room.in_charge = user
                        dining_room.save()
                        user.dining_room_in_charge.set([dining_room])

                if data['status'] == False:
                    dining_rooms = DiningRoom.objects.filter(in_charge=user)
                    for dining_room in dining_rooms:
                        dining_room.in_charge = None
                        dining_room.save()
                        user.dining_room_in_charge.clear()
                user.save()

            return JsonResponse({'message': 'Usuario actualizado correctamente'})
        except IntegrityError as e:
            if 'username' in str(e):
                return JsonResponse({'error': 'El nombre de usuario ya existe'}, status=400)
            elif 'email' in str(e):
                return JsonResponse({'error': 'El correo electrónico ya existe'}, status=400)
            else:
                return JsonResponse({'error': 'Error de integridad de datos'}, status=400)
        except KeyError as e:
            return JsonResponse({'error': f'Campo faltante: {str(e)}'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def role_list(request):
    if request.method == 'GET':
        roles = Role.objects.all().values('id', 'name')
        return JsonResponse(list(roles), safe=False)
    
@csrf_exempt
def get_diner_without_in_charge(request):
    try:
        diners = DiningRoom.objects.filter(in_charge=None).values('id', 'name')
        return JsonResponse(list(diners), safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ===================== EMPLEADOS ===================== #
@csrf_exempt
def get_empleados(request):
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    search_query = request.GET.get('search', '')
    filter_value = request.GET.get('filter', 'all')

    empleados = Employee.objects.filter(
        employee_client_diner_employee__isnull=False
    ).select_related(
        'client', 'payroll'
    ).prefetch_related(
        'employee_client_diner_employee__client_diner__dining_room'
    ).distinct()

    if search_query:
        empleados = empleados.filter(
            Q(employeed_code__icontains=search_query) |
            Q(name__icontains=search_query) |
            Q(lastname__icontains=search_query) |
            Q(second_lastname__icontains=search_query) |
            Q(client__company__icontains=search_query) |
            Q(payroll__description__icontains=search_query) |
            Q(employee_client_diner_employee__client_diner__dining_room__name__icontains=search_query)
        )

    if filter_value != 'all':
        empleados = empleados.filter(client__id=filter_value)

    empleados = empleados.annotate(
        dining_room_name=models.F('employee_client_diner_employee__client_diner__dining_room__name')
    ).values(
        'id', 'employeed_code', 'name', 'lastname', 'second_lastname', 'client__company', 'dining_room_name', 'payroll__description', 'status'
    ).distinct()

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
        empleado = Employee.objects.filter(id=empleado_id).select_related(
            'payroll', 'client'
        ).prefetch_related(
            'employee_client_diner_employee__client_diner__dining_room'
        ).values(
            'id',
            'employeed_code',
            'name',
            'lastname',
            'second_lastname',
            'client__company',
            'client_id',
            'payroll__description',
            'payroll_id',
            'status',
            'employee_client_diner_employee__client_diner__dining_room__name',
            'employee_client_diner_employee__client_diner__dining_room__id'
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

        dining_room = {
            'id': empleado['employee_client_diner_employee__client_diner__dining_room__id'],
            'name': empleado['employee_client_diner_employee__client_diner__dining_room__name']
        }

        context = {
            'id': empleado['id'],
            'employeed_code': empleado['employeed_code'],
            'name': empleado['name'],
            'lastname': empleado['lastname'],
            'second_lastname': empleado['second_lastname'],
            'client': client,
            'payroll': payroll,
            'status': empleado['status'],
            'dining_room': dining_room
        }

        return JsonResponse(context)
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def create_empleado(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Obtener la instancia de PayrollType
            payroll = PayrollType.objects.get(id=data.get('payroll_id'))
            
            # Crear un nuevo empleado
            empleado = Employee(
                employeed_code=data.get('employeed_code'),
                name=data.get('name').upper(),
                lastname=data.get('lastname').upper(),
                second_lastname=data.get('second_lastname').upper(),
                client_id=data.get('client_id'),
                payroll=payroll,  # Asignar la instancia de PayrollType
                status=data.get('status'),
                created_by_id=request.user.id
            )
            
            # Guardar el nuevo empleado
            empleado.save()

            # Crear la relación en EmployeeClientDiner
            dining_room_id = data.get('dining_room_id')
            if dining_room_id:
                client_diner = ClientDiner.objects.get(client_id=empleado.client_id, dining_room_id=dining_room_id)
                EmployeeClientDiner.objects.create(
                    employee=empleado,
                    client_diner=client_diner,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id
                )
            
            return JsonResponse({'message': 'Empleado creado correctamente'})
        except PayrollType.DoesNotExist:
            return JsonResponse({'error': 'Tipo de nómina no encontrado'}, status=404)
        except ClientDiner.DoesNotExist:
            return JsonResponse({'error': 'Cliente-Comedor no encontrado'}, status=404)
        except Exception as e:
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
        
        # Obtener la instancia de PayrollType si se proporciona
        payroll = PayrollType.objects.get(id=data.get('payroll_id')) if data.get('payroll_id') else empleado.payroll
        
        # Actualizar los campos del empleado
        empleado.employeed_code = data.get('employeed_code', empleado.employeed_code)
        empleado.name = data.get('name', empleado.name).upper()
        empleado.lastname = data.get('lastname', empleado.lastname).upper()
        empleado.second_lastname = data.get('second_lastname', empleado.second_lastname).upper()
        empleado.client_id = data.get('client_id', empleado.client_id)
        empleado.payroll = payroll  # Asignar la instancia de PayrollType
        empleado.status = data.get('status', empleado.status)
        
        # Guardar los cambios del empleado
        empleado.save()

        # Actualizar la relación en EmployeeClientDiner
        dining_room_id = data.get('dining_room_id')
        if dining_room_id:
            client_diner = ClientDiner.objects.get(client_id=empleado.client_id, dining_room_id=dining_room_id)
            employee_client_diner, created = EmployeeClientDiner.objects.update_or_create(
                employee=empleado,
                defaults={'client_diner': client_diner}
            )

        return JsonResponse({'message': 'Empleado actualizado correctamente'})
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Empleado no encontrado'}, status=404)
    except PayrollType.DoesNotExist:
        return JsonResponse({'error': 'Tipo de nómina no encontrado'}, status=404)
    except ClientDiner.DoesNotExist:
        return JsonResponse({'error': 'Cliente-Comedor no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_comedores_clientes(request):
    try:
        client_id = request.GET.get('client_id')
        
        if not client_id:
            return JsonResponse({'error': 'El parámetro client_id es obligatorio'}, status=400)
        
        # Realizar la consulta utilizando el ORM de Django
        comedores = DiningRoom.objects.filter(
            client_diner_dining_room__client_id=client_id,
            status=True
        ).values('id', 'name')
        
        comedores_list = list(comedores)
        
        context = {
            'comedores': comedores_list
        }
        
        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# ===================== ARCHIVO EXCEL ===================== #
@csrf_exempt
def upload_empleados(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            cliente_id = data.get('cliente_id')
            comedor_id = data.get('comedor_id')
            empleados = data.get('empleados')

            # Procesar los empleados
            for empleado_data in empleados:
                # Validar los datos del empleado
                if not empleado_data.get('NOMBRES'):
                    return JsonResponse({'error': 'El campo NOMBRES es obligatorio'}, status=400)
                if not empleado_data.get('NO. EMPLEADO'):
                    return JsonResponse({'error': 'El campo NO. EMPLEADO es obligatorio'}, status=400)
                if not empleado_data.get('APELLIDO PATERNO'):
                    return JsonResponse({'error': 'El campo APELLIDO PATERNO es obligatorio'}, status=400)
                if not empleado_data.get('NOMINA'):
                    return JsonResponse({'error': 'El campo NOMINA es obligatorio'}, status=400)

                # Obtener la instancia de PayrollType
                payroll = PayrollType.objects.get(description=empleado_data.get('NOMINA'))

                # Asignar valores predeterminados si los campos son None
                nombre = empleado_data.get('NOMBRES', '').upper()
                apellido_paterno = empleado_data.get('APELLIDO PATERNO', '').upper()
                apellido_materno = empleado_data.get('APELLIDO MATERNO', '').upper()

                # Crear un nuevo empleado
                empleado = Employee(
                    employeed_code=empleado_data.get('NO. EMPLEADO'),
                    name=nombre,
                    lastname=apellido_paterno,
                    second_lastname=apellido_materno,
                    client_id=cliente_id,
                    payroll=payroll,
                    status=empleado_data.get('ESTADO', True),
                    created_by_id=request.user.id
                )
                empleado.save()

                # Crear la relación en EmployeeClientDiner
                if comedor_id:
                    client_diner = ClientDiner.objects.get(client_id=cliente_id, dining_room_id=comedor_id)
                    EmployeeClientDiner.objects.create(
                        employee=empleado,
                        client_diner=client_diner,
                        created_by_id=request.user.id,
                        updated_by_id=request.user.id
                    )

            return JsonResponse({'message': 'Empleados cargados correctamente'})
        except PayrollType.DoesNotExist:
            return JsonResponse({'error': 'Tipo de nómina no encontrado'}, status=404)
        except ClientDiner.DoesNotExist:
            return JsonResponse({'error': 'Cliente-Comedor no encontrado'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    else:
        return JsonResponse({'error': 'Método no permitido'}, status=405)
        

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
        clientes = Client.objects.all().values('id', 'company', 'status')
        context = {
            'clientes': list(clientes)
        }        
        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ===================== REPORTE EMPLEADOS ===================== #
@csrf_exempt
def get_employee_report_general(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)

    try:
        filters = {
            'employee_client_diner__client_diner__client__id': request.GET.get('filterClient'),
            'employee_client_diner__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee_client_diner__employee__employeed_code__icontains': request.GET.get('filterEmployeeNumber'),
            'employee_client_diner__employee__status': request.GET.get('filterStatus'),
            'created_at__gte': request.GET.get('filterStartDate'),
            'created_at__lte': request.GET.get('filterEndDate'),
            'employee_client_diner__isnull': False,
            'voucher__isnull': True
        }

        filters = {k: v for k, v in filters.items() if v}

        entry_employee = Entry.objects.select_related(
            'employee_client_diner__employee',
            'employee_client_diner__client_diner__client',
            'employee_client_diner__client_diner__dining_room'
        ).filter(**filters).values(
            client_company=F('employee_client_diner__client_diner__client__company'),
            client_name=F('employee_client_diner__client_diner__client__name'),
            client_lastname=F('employee_client_diner__client_diner__client__lastname'),
            client_second_lastname=F('employee_client_diner__client_diner__client__second_lastname'),
            dining_room_name=F('employee_client_diner__client_diner__dining_room__name'),
            employee_code=F('employee_client_diner__employee__employeed_code'),
            employee_name=F('employee_client_diner__employee__name'),
            employee_lastname=F('employee_client_diner__employee__lastname'),
            employee_second_lastname=F('employee_client_diner__employee__second_lastname'),
            employee_status=F('employee_client_diner__employee__status'),
            entry_created_at=F('created_at')
        ).order_by('-created_at')

        paginator = Paginator(entry_employee, page_size)

        try:
            entry_employee = paginator.page(page)
        except PageNotAnInteger:
            entry_employee = paginator.page(1)
        except EmptyPage:
            entry_employee = paginator.page(paginator.num_pages)

        context = {
            'entry_employee': list(entry_employee),
            'page': entry_employee.number,
            'pages': paginator.num_pages,
            'has_previous': entry_employee.has_previous(),
            'has_next': entry_employee.has_next()
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_clients_employee_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        filters = {
            'employee_client_diner__client_diner__client__id': request.GET.get('filterClient'),
            'employee_client_diner__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee_client_diner__employee__employeed_code__icontains': request.GET.get('filterEmployeeNumber'),
            'employee_client_diner__employee__status': request.GET.get('filterStatus'),
            'created_at__gte': request.GET.get('filterStartDate'),
            'created_at__lte': request.GET.get('filterEndDate'),
            'employee_client_diner__isnull': False,
            'voucher__isnull': True
        }
        filters = {k: v for k, v in filters.items() if v}

        clients = Entry.objects.select_related(
            'employee_client_diner__client_diner__client'
        ).filter(**filters).values(
            'employee_client_diner__client_diner__client__id',
            'employee_client_diner__client_diner__client__company'
        ).distinct()

        context = {
            'clients': list(clients)
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_diner_employee_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        filters = {
            'employee_client_diner__client_diner__client__id': request.GET.get('filterClient'),
            'employee_client_diner__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee_client_diner__employee__employeed_code__icontains': request.GET.get('filterEmployeeNumber'),
            'employee_client_diner__employee__status': request.GET.get('filterStatus'),
            'created_at__gte': request.GET.get('filterStartDate'),
            'created_at__lte': request.GET.get('filterEndDate'),
            'employee_client_diner__isnull': False,
            'voucher__isnull': True
        }
        filters = {k: v for k, v in filters.items() if v}

        diners = Entry.objects.select_related(
            'employee_client_diner__client_diner__dining_room'
        ).filter(**filters).values(
            'employee_client_diner__client_diner__dining_room__id',
            'employee_client_diner__client_diner__dining_room__name'
        ).distinct()

        context = {
            'diners': list(diners)
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_employee_report_summary(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    try:
        filters = {
            'employee_client_diner__client_diner__client__id': request.GET.get('filterClient'),
            'employee_client_diner__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee_client_diner__employee__employeed_code__icontains': request.GET.get('filterEmployeeNumber'),
            'employee_client_diner__employee__status': request.GET.get('filterStatus'),
            'created_at__gte': request.GET.get('filterStartDate'),
            'created_at__lte': request.GET.get('filterEndDate'),
            'employee_client_diner__isnull': False,
            'voucher__isnull': True
        }
        filters = {k: v for k, v in filters.items() if v}

        employee_report_summary = Entry.objects.select_related(
            'employee_client_diner__employee',
            'employee_client_diner__client_diner__client',
            'employee_client_diner__client_diner__dining_room'
        ).filter(**filters).values(
            employee_id=F('employee_client_diner__employee__id'),
            dining_room_id=F('employee_client_diner__client_diner__dining_room__id'),
            client_company=F('employee_client_diner__client_diner__client__company'),
            client_name=F('employee_client_diner__client_diner__client__name'),
            client_lastname=F('employee_client_diner__client_diner__client__lastname'),
            client_second_lastname=F('employee_client_diner__client_diner__client__second_lastname'),
            dining_room_name=F('employee_client_diner__client_diner__dining_room__name'),
            employee_code=F('employee_client_diner__employee__employeed_code'),
            employee_name=F('employee_client_diner__employee__name'),
            employee_lastname=F('employee_client_diner__employee__lastname'),
            employee_second_lastname=F('employee_client_diner__employee__second_lastname'),
            employee_status=F('employee_client_diner__employee__status')
        ).annotate(
            entry_count=Count('id')
        ).order_by('employee_code')

        paginator = Paginator(employee_report_summary, page_size)
        try:
            employee_report_summary = paginator.page(page_number)
        except PageNotAnInteger:
            employee_report_summary = paginator.page(1)
        except EmptyPage:
            employee_report_summary = paginator.page(paginator.num_pages)

        context = {
            'employee_report_summary': list(employee_report_summary),
            'page': employee_report_summary.number,
            'pages': paginator.num_pages,
            'has_previous': employee_report_summary.has_previous(),
            'has_next': employee_report_summary.has_next()
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_employee_report_summary_details(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    employee_id = request.GET.get('employeeId')
    diner_id = request.GET.get('dinerId')
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 5)

    if not employee_id:
        return JsonResponse({'error': 'employee_id es requerido'}, status=400)
    
    try:
        filters = {
            'employee_client_diner__client_diner__client__id': request.GET.get('filterClient'),
            'employee_client_diner__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee_client_diner__employee__employeed_code__icontains': request.GET.get('filterEmployeeNumber'),
            'employee_client_diner__employee__status': request.GET.get('filterStatus'),
            'created_at__gte': request.GET.get('filterStartDate'),
            'created_at__lte': request.GET.get('filterEndDate'),
            'employee_client_diner__employee__id': employee_id,
            'lots__voucher_type_id': None
        }
        filters = {k: v for k, v in filters.items() if v}

        employee_detail = Entry.objects.select_related(
            'employee_client_diner__employee',
            'employee_client_diner__client_diner__client',
            'employee_client_diner__client_diner__dining_room'
        ).filter(**filters).values(
            employee_code=F('employee_client_diner__employee__employeed_code'),
            employee_name=F('employee_client_diner__employee__name'),
            employee_lastname=F('employee_client_diner__employee__lastname'),
            employee_second_lastname=F('employee_client_diner__employee__second_lastname'),
            employee_status=F('employee_client_diner__employee__status'),
        ).annotate(
            entry=Count('id')
        ).first()

        filters['employee_client_diner__client_diner__dining_room__id'] = diner_id
        
        # Traer las entradas del empleado
        employee_entries = Entry.objects.select_related(
            'employee_client_diner__client_diner__client',
            'employee_client_diner__client_diner__dining_room'
        ).filter(**filters).values(
            client_company=F('employee_client_diner__client_diner__client__company'),
            client_name=F('employee_client_diner__client_diner__client__name'),
            client_lastname=F('employee_client_diner__client_diner__client__lastname'),
            client_second_lastname=F('employee_client_diner__client_diner__client__second_lastname'),
            dining_room_name=F('employee_client_diner__client_diner__dining_room__name'),
            entry_created_at=F('created_at')
        ).order_by('-created_at')

        employee_entries_len = len(employee_entries)
        employee_detail['entry_count'] = employee_entries_len

        paginator = Paginator(employee_entries, page_size)
        try:
            employee_entries = paginator.page(page_number)
        except PageNotAnInteger:
            employee_entries = paginator.page(1)
        except EmptyPage:
            employee_entries = paginator.page(paginator.num_pages)

        context = {
            'employee_detail': employee_detail,
            'employee_entries': list(employee_entries),
            'page': employee_entries.number,
            'pages': paginator.num_pages,
            'has_previous': employee_entries.has_previous(),
            'has_next': employee_entries.has_next()
        }

        return JsonResponse(context)
    except Employee.DoesNotExist:
        return JsonResponse({'error': 'Empleado no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ===================== REPORTE VALES UNICOS ===================== #
@csrf_exempt
def get_unique_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)    

    try:
        # Filtros de vales
        filters = {
            'lots__client_diner__client__id': request.GET.get('filterClient'),
            'lots__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'folio__icontains': request.GET.get('filterVoucherNumber'),
            'status': request.GET.get('filterStatus'),
            'lots__voucher_type_id': 1
        }

        filters = {k: v for k, v in filters.items() if v}

        # Convertir las fechas a datetime si están presentes
        start_date = request.GET.get('filterStartDate')
        end_date = request.GET.get('filterEndDate')
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Filtro de entradas solo cuando se han proporcionado fechas
        entry_filter = {}
        if start_date:
            entry_filter['created_at__gte'] = start_date
        if end_date:
            entry_filter['created_at__lte'] = end_date

        # Si se especifica alguna fecha, se filtran solo los vales con entradas dentro del rango
        if entry_filter:
            vouchers = Voucher.objects.select_related(
                'lots__client_diner__client',
                'lots__client_diner__dining_room',
            ).filter(**filters).filter(
                Exists(
                    Entry.objects.filter(voucher_id=OuterRef('id')).filter(**entry_filter)
                )
            ).values(
                'id',
                client_company=F('lots__client_diner__client__company'),
                client_name=F('lots__client_diner__client__name'),
                client_lastname=F('lots__client_diner__client__lastname'),
                client_second_lastname=F('lots__client_diner__client__second_lastname'),
                dining_room_name=F('lots__client_diner__dining_room__name'),
                voucher_folio=F('folio'),
                voucher_status=F('status')
            ).order_by('-id')
        else:
            # Si no hay fechas, no aplicamos el filtro de entradas
            vouchers = Voucher.objects.select_related(
                'lots__client_diner__client',
                'lots__client_diner__dining_room',
            ).filter(**filters).values(
                'id',
                client_company=F('lots__client_diner__client__company'),
                client_name=F('lots__client_diner__client__name'),
                client_lastname=F('lots__client_diner__client__lastname'),
                client_second_lastname=F('lots__client_diner__client__second_lastname'),
                dining_room_name=F('lots__client_diner__dining_room__name'),
                voucher_folio=F('folio'),
                voucher_status=F('status')
            ).order_by('-id')

        # Obtener los IDs de los vales para buscar las entradas
        voucher_ids = [voucher['id'] for voucher in vouchers]
        
        # Obtener las entradas dentro del rango de fechas si existen fechas
        entry_filters = {
            'voucher_id__in': voucher_ids
        }
        if start_date:
            entry_filters['created_at__gte'] = start_date
        if end_date:
            entry_filters['created_at__lte'] = end_date

        entries = Entry.objects.filter(**entry_filters).values(
            'voucher_id',
            'created_at'
        )

        # Crear un diccionario para mapear las entradas a los vales
        entry_map = {entry['voucher_id']: entry['created_at'] for entry in entries}

        # Añadir la información de las entradas a los vales
        for voucher in vouchers:
            voucher['entry_created_at'] = entry_map.get(voucher['id'], None)

        paginator = Paginator(vouchers, page_size)

        try:
            vouchers = paginator.page(page_number)
        except PageNotAnInteger:
            vouchers = paginator.page(1)
        except EmptyPage:
            vouchers = paginator.page(paginator.num_pages)

        context = {
            'unique_reports': list(vouchers),
            'page': vouchers.number,
            'pages': paginator.num_pages,
            'has_previous': vouchers.has_previous(),
            'has_next': vouchers.has_next()
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    
@csrf_exempt
def get_clients_unique_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        # Filtros para los vales
        filters = {
            'lots__client_diner__client__id': request.GET.get('filterClient'),
            'lots__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'folio__icontains': request.GET.get('filterVoucherNumber'),
            'status': request.GET.get('filterStatus'),
            'lots__voucher_type_id': 1
        }
        filters = {k: v for k, v in filters.items() if v}

        # Convertir las fechas a datetime si están presentes
        start_date = request.GET.get('filterStartDate')
        end_date = request.GET.get('filterEndDate')
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Filtrar los vales
        vouchers = Voucher.objects.select_related(
            'lots__client_diner__client'
        ).filter(**filters)

        # Filtrar los clientes únicos de los vales
        clients = vouchers.values(
            client_id=F('lots__client_diner__client__id'),
            client_company=F('lots__client_diner__client__company')
        ).distinct()

        context = {
            'clients': list(clients)
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_diners_unique_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        # Filtros para los vales
        filters = {
            'lots__client_diner__client__id': request.GET.get('filterClient'),
            'lots__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'folio__icontains': request.GET.get('filterVoucherNumber'),
            'status': request.GET.get('filterStatus'),
            'lots__voucher_type_id': 1
        }
        filters = {k: v for k, v in filters.items() if v}

        # Convertir las fechas a datetime si están presentes
        start_date = request.GET.get('filterStartDate')
        end_date = request.GET.get('filterEndDate')
        
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Filtrar los vales
        vouchers = Voucher.objects.select_related(
            'lots__client_diner__dining_room'
        ).filter(**filters)

        # Filtrar los comensales únicos de los vales
        diners = vouchers.values(
            diner_id=F('lots__client_diner__dining_room__id'),
            diner_name=F('lots__client_diner__dining_room__name')
        ).distinct()

        context = {
            'diners': list(diners)
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# ===================== REPORTE VALES PERPETUOS ===================== #
@csrf_exempt
def get_perpetual_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)

    try:
        # Filtros de vales
        filters = {
            'voucher__lots__client_diner__client__id': request.GET.get('filterClient'),
            'voucher__lots__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee__icontains': request.GET.get('filterEmployeeName'),
            'voucher__status': request.GET.get('filterStatus'),
            'voucher__lots__voucher_type_id': 2  # Tipo de vale perpetuo
        }

        filters = {k: v for k, v in filters.items() if v}

        # Convertir las fechas a datetime si están presentes
        start_date = request.GET.get('filterStartDate')
        end_date = request.GET.get('filterEndDate')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Filtro de entradas solo cuando se han proporcionado fechas
        entry_filter = {}
        if start_date:
            entry_filter['created_at__gte'] = start_date
        if end_date:
            entry_filter['created_at__lte'] = end_date

        # Filtrar solo las entradas cuyo vale es de tipo 1
        entries = Entry.objects.select_related(
            'voucher__lots__client_diner__client',  # Corrected
            'voucher__lots__client_diner__dining_room'  # Corrected
        ).filter(
            **entry_filter
        ).filter(**filters).values(
            'voucher_id',
            client_company=F('voucher__lots__client_diner__client__company'),
            client_name=F('voucher__lots__client_diner__client__name'),
            client_lastname=F('voucher__lots__client_diner__client__lastname'),
            client_second_lastname=F('voucher__lots__client_diner__client__second_lastname'),
            dining_room_name=F('voucher__lots__client_diner__dining_room__name'),
            voucher_folio=F('voucher__folio'),
            employee_name=F('voucher__employee'),
            voucher_status=F('voucher__status'),
            entry_created_at=F('created_at')
        ).order_by('-created_at')

        # Pagination and response handling
        paginator = Paginator(entries, page_size)

        try:
            entries = paginator.page(page_number)
        except PageNotAnInteger:
            entries = paginator.page(1)
        except EmptyPage:
            entries = paginator.page(paginator.num_pages)

        context = {
            'perpetual_reports': list(entries),
            'page': entries.number,
            'pages': paginator.num_pages,
            'has_previous': entries.has_previous(),
            'has_next': entries.has_next()
        }
        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

    
@csrf_exempt
def get_clients_perpetual_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        # Filtros para los vales
        filters = {
            'lots__client_diner__client__id': request.GET.get('filterClient'),
            'lots__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee__icontains': request.GET.get('filterEmployeeName'),
            'status': request.GET.get('filterStatus'),
            'lots__voucher_type_id': 2  # Tipo de vale perpetuo
        }
        filters = {k: v for k, v in filters.items() if v}

        # Convertir las fechas a datetime si están presentes
        start_date = request.GET.get('filterStartDate')
        end_date = request.GET.get('filterEndDate')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Filtrar los vales de tipo 1
        vouchers = Voucher.objects.select_related(
            'lots__client_diner__client'
        ).filter(**filters)

        # Filtrar los clientes únicos de los vales de tipo 1
        clients = vouchers.values(
            client_id=F('lots__client_diner__client__id'),
            client_company=F('lots__client_diner__client__company')
        ).distinct()

        context = {
            'clients': list(clients)
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_diners_perpetual_reports(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        # Filtros para los vales
        filters = {
            'lots__client_diner__client__id': request.GET.get('filterClient'),
            'lots__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee__icontains': request.GET.get('filterEmployeeName'),
            'status': request.GET.get('filterStatus'),
            'lots__voucher_type_id': 2  # Tipo de vale perpetuo
        }
        filters = {k: v for k, v in filters.items() if v}

        # Convertir las fechas a datetime si están presentes
        start_date = request.GET.get('filterStartDate')
        end_date = request.GET.get('filterEndDate')

        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()

        # Filtrar los vales de tipo 1
        vouchers = Voucher.objects.select_related(
            'lots__client_diner__dining_room'
        ).filter(**filters)

        # Filtrar los comensales únicos de los vales de tipo 1
        diners = vouchers.values(
            diner_id=F('lots__client_diner__dining_room__id'),
            diner_name=F('lots__client_diner__dining_room__name')
        ).distinct()

        context = {
            'diners': list(diners)
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_perpetual_report_summary(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 10)
    try:
        filters = {
            'lots__client_diner__client__id': request.GET.get('filterClient'),
            'lots__client_diner__dining_room__id': request.GET.get('filterDiningRoom'),
            'employee__icontains': request.GET.get('filterEmployeeName'),
            'status': request.GET.get('filterStatus'),
            'lots__voucher_type_id': 2  # Tipo de vale perpetuo
        }
        filters = {k: v for k, v in filters.items() if v}

        # Obtener los vales de tipo 1
        perpetual_report_summary = Voucher.objects.select_related(
            'lots__client_diner__client',
            'lots__client_diner__dining_room'
        ).filter(**filters).values(
            voucher_id=F('id'),
            client_company=F('lots__client_diner__client__company'),
            client_name=F('lots__client_diner__client__name'),
            client_lastname=F('lots__client_diner__client__lastname'),
            client_second_lastname=F('lots__client_diner__client__second_lastname'),
            dining_room_name=F('lots__client_diner__dining_room__name'),
            voucher_folio=F('folio'),
            employee_name=F('employee'),
            voucher_status=F('status')
        ).annotate(
            entry_count=Count('entry_voucher')
        ).order_by('voucher_folio')

        paginator = Paginator(perpetual_report_summary, page_size)
        try:
            perpetual_report_summary = paginator.page(page_number)
        except PageNotAnInteger:
            perpetual_report_summary = paginator.page(1)
        except EmptyPage:
            perpetual_report_summary = paginator.page(paginator.num_pages)

        context = {
            'perpetual_report_summary': list(perpetual_report_summary),
            'page': perpetual_report_summary.number,
            'pages': paginator.num_pages,
            'has_previous': perpetual_report_summary.has_previous(),
            'has_next': perpetual_report_summary.has_next()
        }

        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_perpetual_report_summary_details(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    voucher_id = request.GET.get('voucherId')
    page_number = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 5)

    if not voucher_id:
        return JsonResponse({'error': 'voucher_id es requerido'}, status=400)
    
    try:
        filters = {
            'id': voucher_id
        }

        voucher_detail = Voucher.objects.select_related(
            'lots__client_diner__client',
            'lots__client_diner__dining_room'
        ).filter(**filters).values(
            voucher_folio=F('folio'),
            employee_name=F('employee'),
            voucher_status=F('status'),
        ).annotate(
            entry=Count('entry_voucher')
        ).first()

        # Traer las entradas del vale
        entry_filters = {
            'voucher_id': voucher_id
        }

        voucher_entries = Entry.objects.select_related(
            'client_diner__client',
            'client_diner__dining_room'
        ).filter(**entry_filters).values(
            client_company=F('client_diner__client__company'),
            client_name=F('client_diner__client__name'),
            client_lastname=F('client_diner__client__lastname'),
            client_second_lastname=F('client_diner__client__second_lastname'),
            dining_room_name=F('client_diner__dining_room__name'),
            entry_created_at=F('created_at')
        ).order_by('-created_at')

        voucher_entries_len = len(voucher_entries)
        voucher_detail['entry_count'] = voucher_entries_len

        paginator = Paginator(voucher_entries, page_size)
        try:
            voucher_entries = paginator.page(page_number)
        except PageNotAnInteger:
            voucher_entries = paginator.page(1)
        except EmptyPage:
            voucher_entries = paginator.page(paginator.num_pages)

        context = {
            'voucher_detail': voucher_detail,
            'voucher_entries': list(voucher_entries),
            'page': voucher_entries.number,
            'pages': paginator.num_pages,
            'has_previous': voucher_entries.has_previous(),
            'has_next': voucher_entries.has_next()
        }

        if voucher_entries_len == 0:
            context['message'] = 'No se encontraron entradas para este vale.'

        return JsonResponse(context)
    except Voucher.DoesNotExist:
        return JsonResponse({'error': 'Vale no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



# ===================== GENERAR VALES UNICOS ===================== #

@csrf_exempt
def generate_unique_voucher(request):
    if request.method != "POST":
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    try:
        data = json.loads(request.body)
        client_id = data.get("client_id")
        dining_room_id = data.get("dining_room_id")
        quantity = data.get("quantity")
        

        if not client_id or not dining_room_id or not quantity:
            return JsonResponse({"error": "client_id, dining_room_id y quantity son requeridos"}, status=400)
        
        if type(quantity) != int:
            return JsonResponse({"error": "quantity debe ser un número entero"}, status=400)

        if type(client_id) != int:
            return JsonResponse({"error": "client_id debe ser un número entero"}, status=400)
        
        if type(dining_room_id) != int:
            return JsonResponse({"error": "dining_room_id debe ser un número entero"}, status=400)
        
        unique_voucher = VoucherType.objects.filter(description="UNICO").first()     
        client_dinner = ClientDiner.objects.filter(client_id=client_id, dining_room_id=dining_room_id).first()

        if not client_dinner:
            return JsonResponse({"error": "No se encontró la relación entre cliente y comedor"}, status=400)
        
        if not client_dinner.client.status:
            return JsonResponse({"error": f"El cliente {client_dinner.client.company} ha sido desactivado."}, status=400)
        
        if not client_dinner.dining_room.status:
            return JsonResponse({"error": f"El comedor {client_dinner.dining_room.name} ha sido desactivado."}, status=400)
    
        if not client_dinner.status:
            return JsonResponse({"error": f"El uso del comedor por parte de  {client_dinner.client.company} ha sido desactivado."}, status=400)
        



        diningroom = client_dinner.dining_room
        
        clean_pdf_dir()
        
        with transaction.atomic():
            lots = Lots(
                client_diner=client_dinner,
                voucher_type=unique_voucher,
                quantity=quantity,
                created_by=request.user
            )
            lots.save()
            
            vouchers: list[Voucher] = []
            
            for _ in range(quantity):
                voucher = Voucher(lots=lots)
                voucher.save()
                vouchers.append(voucher)
            
            qr_paths = prepare_qrs(vouchers, lots.id, diningroom.name)
            
            
            filename = f'/LOT-{lots.id}.pdf'
            generate_qrs_pdf(qr_paths, filename)
            
            context = {
                "lot_id": lots.id,
                "pdf": filename,
                "email": client_dinner.client.email,
                "message": "Vales generados con éxito"
            }
            
            for qr in qr_paths:
                os.remove(qr[0])


            return JsonResponse(context)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def generate_perpetual_voucher(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        client_id = data.get('client_id')
        dining_room_id = data.get('dining_room_id')
        quantity = data.get('quantity')
        employees = data.get('employees')
        
        
        if not client_id or not dining_room_id or not quantity or not employees:
            return JsonResponse({'error': 'client_id, dining_room_id, quantity y employees son requeridos'}, status=400)
        
        if type(quantity) != int:
            return JsonResponse({'error': 'La cantidad debe ser un número entero'}, status=400)
        
        if type(client_id) != int:
            return JsonResponse({'error': 'El id del cliente debe ser un número entero'}, status=400)

        if type(dining_room_id) != int:
            return JsonResponse({'error': 'El id del comedor debe ser un número entero'}, status=400)  
        
        if type(employees) != list:
            return JsonResponse({'error': 'Se tiene que incluir una lista de empleados'}, status=400)
        
        if quantity > 99:
            return JsonResponse({'error': 'La cantidad no puede ser mayor a 99'}, status=400)

        if quantity != len(employees):
            return JsonResponse({'error': 'La cantidad de empleados debe ser igual a la cantidad de vales'}, status=400)
        
        
        perpetual_voucher = VoucherType.objects.filter(description="PERPETUO").first()
        
        client_dinner = ClientDiner.objects.filter(client_id=client_id, dining_room_id=dining_room_id).first()

        if not client_dinner:
            return JsonResponse({"error": "No se encontró la relación entre cliente y comedor"}, status=400)
        
        if not client_dinner.client.status:
            return JsonResponse({"error": f"El cliente {client_dinner.client.company} ha sido desactivado."}, status=400)

        if not client_dinner.dining_room.status:
            return JsonResponse({"error": f"El comedor {client_dinner.dining_room.name} ha sido desactivado."}, status=400)
        
        if not client_dinner.status:
            return JsonResponse({"error": f"El uso del comedor por parte de  {client_dinner.client.company} ha sido desactivado."}, status=400)
        


        with transaction.atomic():
            lots = Lots(
                client_diner=client_dinner,
                voucher_type=perpetual_voucher,
                quantity=quantity,
                created_by=request.user
            )

            vouchers = []
            
            for employee in employees:
                if type(employee) != str:
                    return JsonResponse({"error": "Los empleados deben ser cadenas de texto"}, status=400)

                voucher = Voucher(lots=lots, employee=employee)
                vouchers.append(voucher)
            
            lots.save()
            
            for voucher in vouchers:
                voucher.save()

        return JsonResponse({'message': 'Vales generados con éxito'})
    except Exception as err:
        return JsonResponse({"error": str(err)}, status=500)
        
@csrf_exempt
def send_lot_file_email(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    try:
        data = json.loads(request.body)
        email = data.get('email')
        lot = data.get('lot_id')
        
        
        #validate email being not null
        if not email:
            return JsonResponse({'error': 'El email es requerido'}, status=400)
        
        #validate lots being not null
        if not lot:
            return JsonResponse({'error': 'El lote es requerido'}, status=400)
        
        #validate email being a string
        if type(email) != str:
            return JsonResponse({'error': 'El email debe ser una cadena de texto'}, status=400)
        
        #validate lot being an int
        if type(lot) != int:
            return JsonResponse({'error': 'El lote debe ser un número entero'}, status=400)
        
        #Validate email being less or equal to 100
        if len(email) > 100:
            return JsonResponse({'error': 'El email no puede ser mayor a 100 caracteres'}, status=400)
        
        lot_object = Lots.objects.get(id=lot)
        
        if not lot_object:
            return JsonResponse({'error': 'El lote no existe'}, status=404)
        
        sender_email = config('EMAIL') 
        sender_password = config('EMAIL_PASSWORD')

        if not sender_email or not sender_password:
            return JsonResponse({"error": "No se tiene configurado el email para enviar correos"},status=500)
        

        email_message = EmailMessage()

        filepath = None
        try:
            filepath = generate_lot_pdf(lot) 
        except Exception as err:
            print(err)
            return JsonResponse({"error": "Hubo un error generando el pdf"}, status=500)


        with open(filepath, "rb") as f:
            pdf_data = f.read()
            email_message.add_attachment(pdf_data, maintype="application", subtype="pdf", filename=f"LOT-{lot}.pdf")
        
        email_context = ssl.create_default_context()
        subject = f'Archivo de lote {lot}'
        email_message['From'] = sender_email
        email_message['To'] = email
        email_message['Subject'] = subject

        
        with smtplib.SMTP_SSL('smtp.gmail.com', 465, context=email_context) as server:
            try:
                server.login(sender_email, sender_password)
            except Exception as err:
                return JsonResponse({"error": "No se puedo iniciar sesión en el servidor de correos"}, status=500)

            try:
                server.sendmail(sender_email, email, email_message.as_string())
            except Exception as err:
                return JsonResponse({"error": "No se pudo enviar el correo"})
         
        lot_object.email = email
        lot_object.save()
        return JsonResponse({"message": "Email enviado con éxito"})
        
    
    except Exception as err:
        return JsonResponse({'error': str(err)}, status=500)
  