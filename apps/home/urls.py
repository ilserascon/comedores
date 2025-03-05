# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.urls import path, re_path
from apps.home import views

urlpatterns = [

    # The home page
    path('', views.index, name='home'),

    path('users', views.user_list, name='user_list'),
    path('users/<int:user_id>', views.user_detail, name='user_detail'),
    path('roles', views.role_list, name='role_list'),

    # Matches any html file
    re_path(r'^.*\.*', views.pages, name='pages'),

]
