# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.urls import path, re_path
from apps.home import views

urlpatterns = [

    # The home page
    path('', views.index, name='home'),    

    # ======================= DINING ROOMS =======================
    path('get_comedores', views.get_comedores, name='get_comedores'),
    path('get_comedor', views.get_comedor, name='get_comedor'),
    path('create_comedor', views.create_comedor, name='create_comedor'),
    path('update_comedor', views.update_comedor, name='update_comedor'),
    path('get_encargados', views.get_encargados, name='get_encargados'),
    path('get_client_diner', views.get_client_diner, name='get_client_diner'),

    # Matches any html file
    re_path(r'^.*\.*', views.pages, name='pages'),

]
