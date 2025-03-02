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
from apps.authentication.models import CustomUser
from django.core.paginator import Paginator
from django.db.models import Q
from django.db import IntegrityError
import json


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
            created_by_id=created_by_id
        )

        if len(dining_room.description) > 100:
            return JsonResponse({'error': 'La descripción no puede tener más de 100 caracteres'}, status=400)

        dining_room.save()

        # Crear la entrada en el modelo ClientDiner
        client_diner = ClientDiner(
            dining_room_id=dining_room.id,
            client_id=client_id,
            created_by_id=in_charge
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