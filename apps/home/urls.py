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
    path('get_all_comedores', views.get_all_comedores, name='get_all_comedores'),
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
    path('validar_vale', views.validar_vale, name='validar_vale'),    
    path('entradas_view', views.entradas_view, name='entradas_view'),


    # ===================== REPORTE EMPLEADOS ===================== #
    path('get_employee_report_general', views.get_employee_report_general, name='get_employee_report_general'),
    path('get_clients_employee_reports', views.get_clients_employee_reports, name='get_clients_employee_reports'),
    path('get_diner_employee_reports', views.get_diner_employee_reports, name='get_diner_employee_reports'),
    path('get_employee_report_summary', views.get_employee_report_summary, name='get_employee_report_summary'),
    path('get_employee_report_summary_details', views.get_employee_report_summary_details, name='get_employee_report_summary_details'),

    # ===================== REPORTE VALES UNICOS ===================== #
    path('get_unique_reports', views.get_unique_reports, name='get_unique_reports'),
    path('get_clients_unique_reports', views.get_clients_unique_reports, name='get_clients_unique_reports'),
    path('get_diners_unique_reports', views.get_diners_unique_reports, name='get_diners_unique_reports'),

    # ===================== REPORTE VALES PERPETUOS ===================== #
    path('get_perpetual_reports', views.get_perpetual_reports, name='get_perpetual_reports'),
    path('get_clients_perpetual_reports', views.get_clients_perpetual_reports, name='get_clients_perpetual_reports'),
    path('get_diners_perpetual_reports', views.get_diners_perpetual_reports, name='get_diners_perpetual_reports'),
    path('get_perpetual_report_summary', views.get_perpetual_report_summary, name='get_perpetual_report_summary'),
    path('get_perpetual_report_summary_details', views.get_perpetual_report_summary_details, name='get_perpetual_report_summary_details'),

    # ===================== GENERAR VOUCHERS ===================== #
    path('generate_unique_voucher', views.generate_unique_voucher, name='generate_unique_voucher'),
    path('generate_perpetual_voucher', views.generate_perpetual_voucher, name='generate_perpetual_voucher'),
    path('send_lot_file_email', views.send_lot_file_email, name='send_lot_file_email'),
    path('generate_perpetual_voucher_qr', views.generate_perpetual_voucher_qr, name='generate_perpetual_voucher_qr'),

    # Matches any html file
    re_path(r'^.*\.*', views.pages, name='pages'),

]
