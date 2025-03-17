# -*- encoding: utf-8 -*-
"""
Copyright (c) 2019 - present AppSeed.us
"""

from django.db import models
from django.contrib.auth.models import User
from django.conf import settings
from core.settings import AUTH_USER_MODEL
from django.db.models.signals import post_save
from django.dispatch import receiver


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
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='client_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='client_updated_by')
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'client'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'

    def __str__(self):
        return "Compañía: " + self.company + ', Encargado:' + self.name + ' ' + self.lastname + ' ' + self.second_lastname
    
class DiningRoom(models.Model):
    name = models.CharField(max_length=50)
    in_charge = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='dining_room_in_charge', null=True, blank=True)
    description = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='dining_room_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='dining_room_updated_by')
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'dining_room'
        verbose_name = 'Dining Room'
        verbose_name_plural = 'Dining Rooms'

    def __str__(self):
        return "Comedor: " + self.name + ', Ubicación: ' + self.description
    
class ClientDiner(models.Model):
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='client_diner_client')
    dining_room = models.ForeignKey(DiningRoom, on_delete=models.PROTECT, related_name='client_diner_dining_room')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='client_diner_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='client_diner_updated_by')
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'client_diner'
        verbose_name = 'Client Diner'
        verbose_name_plural = 'Clients Diners'

    def __str__(self):
        return "Cliente: " + self.client.company + ', Comedor Asignado: ' + self.dining_room.name
    
class PayrollType(models.Model):
    description = models.CharField(max_length=50)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'payroll_type'
        verbose_name = 'Payroll Type'
        verbose_name_plural = 'Payroll Types'

class Employee(models.Model):
    client = models.ForeignKey(Client, on_delete=models.PROTECT, related_name='employee_client')
    employeed_code = models.CharField(max_length=25, blank=True, null=True)
    name = models.CharField(max_length=50)
    lastname = models.CharField(max_length=50)
    second_lastname = models.CharField(max_length=50, null=True, blank=True)
    payroll = models.ForeignKey(PayrollType, on_delete=models.PROTECT, related_name='employee_payroll')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='employee_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='employee_updated_by', null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'employee'
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def __str__(self):
        return "Empleado: " + self.name + ' ' + self.lastname + ' ' + self.second_lastname
    
class EmployeeClientDiner(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.PROTECT, related_name='employee_client_diner_employee')
    client_diner = models.ForeignKey(ClientDiner, on_delete=models.PROTECT, related_name='employee_client_diner_client_diner')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='employee_diner_created_by')
    updated_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='employee_diner_updated_by', null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'employee_client_diner'
        verbose_name = 'Employee Client Diner'
        verbose_name_plural = 'Employees Clients Diners'

    def __str__(self):
        return "Empleado: " + self.employee.name + ' ' + self.employee.lastname + ' ' + self.employee.second_lastname + ', Cliente Asignado: ' + self.client_diner.client.company + ', Comedor Asignado: ' + self.client_diner.dining_room.name
    
class VoucherType(models.Model):
    description = models.CharField(max_length=50)

    class Meta:
        db_table = 'voucher_type'
        verbose_name = 'Voucher Type'
        verbose_name_plural = 'Voucher Types'

class Lots(models.Model):
    client_diner = models.ForeignKey(ClientDiner, on_delete=models.PROTECT, related_name='lots_client_diner')
    voucher_type = models.ForeignKey(VoucherType, on_delete=models.PROTECT, related_name='lots_voucher_type')
    quantity = models.IntegerField()
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='lots_created_by', null=True, blank=True)

    class Meta:
        db_table = 'lots'
        verbose_name = 'Lot'
        verbose_name_plural = 'Lots'

class Voucher(models.Model):
    lots = models.ForeignKey(Lots, on_delete=models.PROTECT, related_name='voucher_lots')
    folio = models.CharField(max_length=100, blank=True)
    employee = models.CharField(max_length=100, null=True, blank=True)
    status = models.BooleanField(default=True)

    class Meta:
        db_table = 'voucher'
        verbose_name = 'Voucher'
        verbose_name_plural = 'Vouchers'

@receiver(post_save, sender=Voucher)
def generate_folio(sender, instance, created, **kwargs):
    if created and not instance.folio:
        instance.folio = f'{instance.lots.id}-{instance.id}'
        instance.save()


class Entry(models.Model):
    employee_client_diner = models.ForeignKey(EmployeeClientDiner, on_delete=models.PROTECT, related_name='entry_employee_client_diner', null=True, blank=True)
    voucher = models.ForeignKey(Voucher, on_delete=models.PROTECT, related_name='entry_voucher', null=True, blank=True)
    client_diner = models.ForeignKey(ClientDiner, on_delete=models.PROTECT, related_name='entry_client_diner')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'entry'
        verbose_name = 'Entry'
        verbose_name_plural = 'Entries'