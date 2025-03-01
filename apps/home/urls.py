# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.urls import path, re_path
from apps.home import views

urlpatterns = [

    # The home page
    path('', views.index, name='home'),

    path('client_list', views.client_list, name='client_list'),
    path('client_detail/<int:client_id>', views.client_detail, name='client_detail'),

    # Matches any html file
    re_path(r'^.*\.*', views.pages, name='pages'),

]
