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
from .models import DiningRoom, ClientDiner, Client
from apps.authentication.models import CustomUser, Role
from django.db.models import Q
from django.db import IntegrityError
import json
from django.contrib.auth.hashers import make_password
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from .transactions.clients import change_client_status


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
    

# ============================= COMEDORES =============================
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
        dining_room = DiningRoom.objects.select_related('in_charge').values(
            'id', 'name', 'description', 'status', 'in_charge__first_name', 'in_charge__last_name', 'in_charge_id'
        ).get(id=dining_room_id)

        in_charge = {
            'id': dining_room['in_charge_id'],
            'first_name': dining_room['in_charge__first_name'],
            'last_name': dining_room['in_charge__last_name']
        }

        context = {
            'dining_room_id': dining_room['id'],
            'name': dining_room['name'],
            'description': dining_room['description'],
            'status': dining_room['status'],
            'in_charge': in_charge,
        }

        return JsonResponse(context)
    except DiningRoom.DoesNotExist:
        return JsonResponse({'error': 'Comedor no encontrado'}, status=404)
    except Exception as e:
        print(f"Error: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@login_required(login_url="/login/")
def index(request):
    context = {'segment': 'index'}

    html_template = loader.get_template('home/index.html')
    return HttpResponse(html_template.render(context, request))

@login_required(login_url="/login/")
def pages(request):
    context = {}
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

# ================================== COMEDORES ================================== #
@csrf_exempt
def get_comedores(request):
    try:
        filter_value = request.GET.get('filter', 'all')
        dining_rooms_query = ClientDiner.objects.select_related('client', 'dining_room', 'dining_room__in_charge').values(
            'client__company',
            'dining_room__id',
            'dining_room__name',
            'dining_room__description',
            'dining_room__in_charge__first_name',
            'dining_room__in_charge__last_name',
            'dining_room__status'
        ).distinct()
        if filter_value != 'all':
            dining_rooms_query = dining_rooms_query.filter(client__id=filter_value)
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
        clients = Client.objects.values('id', 'company').distinct()
        page_number = request.GET.get('page', 1)
        paginator = Paginator(dining_rooms_list, 10)
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
        dining_room = DiningRoom.objects.filter(id=dining_room_id).select_related('in_charge', 'clientdiner__client').values(
            'id', 'name', 'description', 'status', 'in_charge__first_name', 'in_charge__last_name', 'in_charge_id',
            'clientdiner__client__id'
        ).first()

        if not dining_room:
            return JsonResponse({'error': 'Comedor no encontrado'}, status=404)

        in_charge = {
            'id': dining_room['in_charge_id'],
            'first_name': dining_room['in_charge__first_name'],
            'last_name': dining_room['in_charge__last_name']
        }

        context = {
            'dining_room_id': dining_room['id'],
            'name': dining_room['name'],
            'description': dining_room['description'],
            'status': dining_room['status'],
            'in_charge': in_charge,
            'client_id': dining_room['clientdiner__client__id']
        }        

        return JsonResponse(context)
    except DiningRoom.DoesNotExist:
        return JsonResponse({'error': 'Comedor no encontrado'}, status=404)
    except Exception as e:
        print(f"Error: {e}")
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
        created_by_id = in_charge

        if not in_charge:
            return JsonResponse({'error': 'El campo in_charge es obligatorio'}, status=400)

        if not client_id:
            return JsonResponse({'error': 'El campo client es obligatorio'}, status=400)

        # Crear el comedor en el modelo DiningRoom
        dining_room = DiningRoom(
            name=name,
            description=description,
            status=status,
            in_charge_id=in_charge,
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
            created_by_id=in_charge,
            updated_by_id=request.user.id
        )
        client_diner.save()

        return JsonResponse({'message': 'Comedor creado correctamente'}, status=201)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def update_comedor(request):
    try:
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

        if in_charge:
            dining_room.in_charge_id = in_charge

        dining_room.save()

        # Actualizar la entrada en el modelo ClientDiner
        client_diner, created = ClientDiner.objects.update_or_create(
            dining_room_id=dining_room_id,
            defaults={'client_id': client_id}
        )

        return JsonResponse({'message': 'Comedor actualizado correctamente'})
    except DiningRoom.DoesNotExist:
        return JsonResponse({'error': 'Comedor no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def get_encargados(request):
    try:
        encargados = CustomUser.objects.all().values('id', 'first_name', 'last_name')
        context = {
            'encargados': list(encargados)
        }
        return JsonResponse(context)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    

# Obtiene todos los clientes
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


@csrf_exempt
def user_list(request):
    if request.method == 'GET':
        search_query = request.GET.get('search', '')
        users = CustomUser.objects.all().order_by('id').values('id', 'username', 'first_name', 'last_name', 'second_last_name', 'email', 'role__name', 'status')

        if search_query:
            users = users.filter(
                Q(username__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(second_last_name__icontains=search_query)
            )

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

            if len(data['first_name']) < 2 or len(data['last_name']) < 2 or len(data['second_last_name']) < 2:
                return JsonResponse({'error': 'El nombre, apellido paterno y apellido materno deben tener al menos 2 caracteres'}, status=400)
                        
            if '@' not in data['email'] or '.' not in data['email']:
                return JsonResponse({'error': 'Correo electrónico inválido'}, status=400)
            
            if len(data['password']) < 8 or not any(char.isdigit() for char in data['password']) or not any(char.isalpha() for char in data['password']):
                return JsonResponse({'error': 'La contraseña debe tener al menos 8 caracteres, una letra y un número'}, status=400)

            user = CustomUser.objects.create(
                username=data['username'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                second_last_name=data['second_last_name'],
                email=data['email'],
                password=make_password(data['password']),
                role=role,
                status=data.get('status', True),
                created_by=request.user
            )
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
            user_data = CustomUser.objects.filter(id=user_id).values('id', 'username', 'first_name', 'last_name', 'second_last_name', 'email', 'role__name', 'status', 'created_by', 'updated_by').first()
            return JsonResponse(user_data)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            print(data)
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)

            if len(data['username']) < 5:
                return JsonResponse({'error': 'El nombre de usuario debe tener al menos 5 caracteres'}, status=400)
            
            if len(data['first_name']) < 2 or len(data['last_name']) < 2 or len(data['second_last_name']) < 2:
                return JsonResponse({'error': 'El nombre, apellido paterno y apellido materno deben tener al menos 2 caracteres'}, status=400)
            
            if '@' not in data['email'] or '.' not in data['email']:
                return JsonResponse({'error': 'Correo electrónico inválido'}, status=400)
            
            if 'password' in data or 'password' is not None:
                if len(data['password']) < 8 or not any(char.isdigit() for char in data['password']) or not any(char.isalpha() for char in data['password']):
                    return JsonResponse({'error': 'La contraseña debe tener al menos 8 caracteres, una letra y un número'}, status=400)
                user.password = make_password(data['password'])
            if 'role_id' in data:
                user.role = get_object_or_404(Role, id=data['role_id'])
            user.status = data.get('status', user.status)
            user.save()
            return JsonResponse({'message': 'Usuario actualizado correctamente'})
        except IntegrityError as e:
            if 'username' in str(e):
                return JsonResponse({'error': 'El nombre de usuario ya existe'}, status=400)
            elif 'email' in str(e):
                return JsonResponse({'error': 'El correo electrónico ya existe'}, status=400)
            else:
                return JsonResponse({'error': 'Error de integridad de datos'}, status=400)
        except Exception as e:
            print(e)
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def role_list(request):
    if request.method == 'GET':
        roles = Role.objects.all().values('id', 'name')
        return JsonResponse(list(roles), safe=False)
