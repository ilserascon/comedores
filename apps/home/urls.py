# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.urls import path, re_path
from apps.home import views

urlpatterns = [

    # The home page
    path('', views.index, name='home'),

    # ===================== EMPLEADOS ===================== #
    path('get_empleado', views.get_empleado, name='get_empleado'),
    path('get_empleados', views.get_empleados, name='get_empleados'),
    path('create_empleado', views.create_empleado, name='create_empleado'),
    path('update_empleado', views.update_empleado, name='update_empleado'),


    # ===================== TIPOS DE NOMINA ===================== #
    path('get_tipos_nomina', views.get_tipos_nomina, name='get_tipos_nomina'),

    # ===================== CLIENTES ===================== #
    path('get_clientes', views.get_clientes, name='get_clientes'),

    # Matches any html file
    re_path(r'^.*\.*', views.pages, name='pages'),

]
