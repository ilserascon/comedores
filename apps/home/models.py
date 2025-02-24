# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.db import models
from django.contrib.auth.models import User
from core.settings import AUTH_USER_MODEL

# Create your models here.

class Client(models.Model):
    company = models.CharField(max_length=50)
    name = models.CharField(max_length=50)
    lastname = models.CharField(max_length=50)
    second_lastname = models.CharField(max_length=50, null=True, blank=True)
    rfc = models.CharField(max_length=13)
    email = models.EmailField()
    phone = models.CharField(max_length=10)
    address = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_updated_by', null=True, blank=True)
    deleted_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_deleted_by', null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'client'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'

    def __str__(self):
        return "Compañía: " + self.company + ', Encargado:' + self.name + ' ' + self.lastname + ' ' + self.second_lastname
    
class DiningRoom(models.Model):
    name = models.CharField(max_length=50)
    in_charge = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dining_room_in_charge')
    description = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dining_room_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dining_room_updated_by', null=True, blank=True)
    deleted_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dining_room_deleted_by', null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'dining_room'
        verbose_name = 'Dining Room'
        verbose_name_plural = 'Dining Rooms'

    def __str__(self):
        return "Comedor: " + self.name + ', Descripción: ' + self.description
    
class ClientDiner(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='client_diner_client')
    dining_room = models.ForeignKey(DiningRoom, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_diner_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_diner_updated_by', null=True, blank=True)
    deleted_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_diner_deleted_by', null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'client_diner'
        verbose_name = 'Client Diner'
        verbose_name_plural = 'Clients Diners'

    def __str__(self):
        return "Cliente: " + self.client.company + ', Comedor Asignado: ' + self.dining_room.name
    
class Employee(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='employee_client')
    employeed_code = models.CharField(max_length=25, blank=True, null=True)
    name = models.CharField(max_length=50)
    lastname = models.CharField(max_length=50)
    second_lastname = models.CharField(max_length=50, null=True, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=10, blank=True, null=True)
    payroll = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_updated_by', null=True, blank=True)
    deleted_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_deleted_by', null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'employee'
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def __str__(self):
        return "Empleado: " + self.name + ' ' + self.lastname + ' ' + self.second_lastname
    
class EmployeeClientDiner(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='employee_client_diner_employee')
    client_diner = models.ForeignKey(ClientDiner, on_delete=models.CASCADE, related_name='employee_client_diner_client_diner')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_diner_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_diner_updated_by', null=True, blank=True)
    deleted_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='employee_diner_deleted_by', null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'employee_client_diner'
        verbose_name = 'Employee Client Diner'
        verbose_name_plural = 'Employees Clients Diners'

    def __str__(self):
        return "Empleado: " + self.employee.name + ' ' + self.employee.lastname + ' ' + self.employee.second_lastname + ', Cliente Asignado: ' + self.client_diner.client.company + ', Comedor Asignado: ' + self.client_diner.dining_room.name