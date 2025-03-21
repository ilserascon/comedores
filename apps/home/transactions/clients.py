from django.db import transaction
from apps.home.models import Client, Employee, ClientDiner, EmployeeClientDiner, DiningRoom
from apps.authentication.models import CustomUser


@transaction.atomic
def change_client_status(user: CustomUser, client: Client, status: bool):
  client_diners = ClientDiner.objects.filter(client=client).all()
  
  if not status:
    employees = Employee.objects.filter(client=client).all()
    for employee in employees:
      employee.status = status
      employee.updated_by = user
    
      employee_client_diners = EmployeeClientDiner.objects.filter(employee=employee).all()
    
      for employee_client_diner in employee_client_diners:
        employee_client_diner.status = status
        employee_client_diner.updated_by = user
        employee_client_diner.save()
    
      employee.save()
  
  for client_diner in client_diners:
    client_diner.status = status
    client_diner.dining_room   
    client_diner.dining_room.status = status
    client_diner.dining_room.updated_by = user
    client_diner.dining_room.save()
    
    if not status:
      for employee_client_diner in employee_client_diners:
        employee_client_diner.status = status
        employee_client_diner.updated_by = user
        employee_client_diner.save()
    
    client_diner.updated_by = user
    client_diner.save()
  
  client.status = status
  client.save()
  
  
  