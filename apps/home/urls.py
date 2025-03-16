# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.urls import path, re_path
from apps.home import views

urlpatterns = [

    # The home page
    path('', views.index, name='home'),    

    # ======================= COMEDORES ======================= #
    path('get_comedores', views.get_comedores, name='get_comedores'),
    path('get_comedor', views.get_comedor, name='get_comedor'),
    path('create_comedor', views.create_comedor, name='create_comedor'),
    path('update_comedor', views.update_comedor, name='update_comedor'),
    path('get_encargados', views.get_encargados, name='get_encargados'),

    # ======================= CLIENTES ======================= #
    path('get_clientes', views.get_clientes, name='get_clientes'),
    path('get_clientes_comedores', views.get_clientes_comedores, name='get_clientes_comedores'),
    path('get_comedores_clientes', views.get_comedores_clientes, name='get_comedores_clientes'),
    path('client_list', views.client_list, name='client_list'),
    path('client_detail/<int:client_id>', views.client_detail, name='client_detail'),

    # ======================= USUARIOS ======================= #
    path('users', views.user_list, name='user_list'),
    path('users/<int:user_id>', views.user_detail, name='user_detail'),
    path('roles', views.role_list, name='role_list'),
    path('diners-without-in-charge', views.get_diner_without_in_charge, name='diners-without-in-charge'),

    # ===================== EMPLEADOS ===================== #
    path('get_empleado', views.get_empleado, name='get_empleado'),
    path('get_empleados', views.get_empleados, name='get_empleados'),
    path('create_empleado', views.create_empleado, name='create_empleado'),
    path('update_empleado', views.update_empleado, name='update_empleado'),

    # ARCHIVO EXCEL
    path('upload_empleados', views.upload_empleados, name='upload_empleados'),

    # ===================== TIPOS DE NOMINA ===================== #
    path('get_tipos_nomina', views.get_tipos_nomina, name='get_tipos_nomina'),

    # ===================== ENTRADAS ===================== #
    path('get_informacion_comedor_entradas', views.get_informacion_comedor_entradas, name='get_informacion_comedor_entradas'),

    # Matches any html file
    re_path(r'^.*\.*', views.pages, name='pages'),

]
