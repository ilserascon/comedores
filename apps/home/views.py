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
from .models import DiningRoom
from apps.authentication.models import CustomUser
from django.shortcuts import get_object_or_404
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
        dining_rooms = DiningRoom.objects.all().select_related('in_charge').values(
            'id', 'name', 'description', 'status', 'in_charge__first_name', 'in_charge__last_name'
        )

        # Rename fields to avoid confusion
        dining_rooms_list = [
            {
                'dining_room_id': dr['id'],
                'name': dr['name'],
                'description': dr['description'],
                'status': dr['status'],
                'in_charge_first_name': dr['in_charge__first_name'],
                'in_charge_last_name': dr['in_charge__last_name']
            }
            for dr in dining_rooms
        ]

        context = {
            'dining_rooms': dining_rooms_list
        }

        print(context)

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
        created_by_id = in_charge;

        if not in_charge:
            return JsonResponse({'error': 'El campo in_charge es obligatorio'}, status=400)                

        dining_room = DiningRoom(
            name=name,
            description=description,
            status=status,
            in_charge_id=in_charge,
            created_by_id=created_by_id
        )

        if dining_room.description.__len__() > 100:
            return JsonResponse({'error': 'La descripción no puede tener más de 100 caracteres'}, status=400)

        dining_room.save()

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

        dining_room = DiningRoom.objects.get(id=dining_room_id)
        dining_room.name = name
        dining_room.description = description
        dining_room.status = status

        if dining_room.description.__len__() > 100:
            return JsonResponse({'error': 'La descripción no puede tener más de 100 caracteres'}, status=400)

        # Use existing in_charge if not provided
        if in_charge:
            dining_room.in_charge_id = in_charge

        dining_room.save()

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
