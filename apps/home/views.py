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
from django.contrib.auth.hashers import make_password
from apps.authentication.models import CustomUser, Role
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
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)

            if len(data['username']) < 5:
                return JsonResponse({'error': 'El nombre de usuario debe tener al menos 5 caracteres'}, status=400)
            
            if len(data['first_name']) < 2 or len(data['last_name']) < 2 or len(data['second_last_name']) < 2:
                return JsonResponse({'error': 'El nombre, apellido paterno y apellido materno deben tener al menos 2 caracteres'}, status=400)
            
            if '@' not in data['email'] or '.' not in data['email']:
                return JsonResponse({'error': 'Correo electrónico inválido'}, status=400)

            if len(data['password']) < 8 or not any(char.isdigit() for char in data['password']) or not any(char.isalpha() for char in data['password']):
                return JsonResponse({'error': 'La contraseña debe tener al menos 8 caracteres, una letra y un número'}, status=400)
            
            if 'password' in data:
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
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)
            if 'password' in data:
                user.password = make_password(data['password'])
            if 'role_id' in data:
                user.role = get_object_or_404(Role, id=data['role_id'])
            user.status = data.get('status', user.status)
            user.save()
            return JsonResponse({'message': 'User updated successfully'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def role_list(request):
    if request.method == 'GET':
        roles = Role.objects.all().values('id', 'name')
        return JsonResponse(list(roles), safe=False)