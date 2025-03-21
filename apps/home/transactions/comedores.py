from django.db import transaction
from apps.home.models import DiningRoom, Employee, ClientDiner, EmployeeClientDiner
from apps.authentication.models import CustomUser

@transaction.atomic
def change_dining_room_status(user: CustomUser, dining_room: DiningRoom, status: bool):
    # Obtener los ClientDiner relacionados con el comedor
    client_diners = ClientDiner.objects.filter(dining_room=dining_room).all()
    
    for client_diner in client_diners:
        client_diner.status = status
        client_diner.updated_by = user
        client_diner.save()
        
        # Obtener los EmployeeClientDiner relacionados con el ClientDiner
        employee_client_diners = EmployeeClientDiner.objects.filter(client_diner=client_diner).all()
        
        for employee_client_diner in employee_client_diners:
            employee_client_diner.status = status
            employee_client_diner.updated_by = user
            employee_client_diner.save()
            
            # Desactivar el empleado relacionado
            employee = employee_client_diner.employee
            employee.status = status
            employee.updated_by = user
            employee.save()
    
    # Finalmente, desactivar el comedor
    dining_room.status = status
    dining_room.updated_by = user
    dining_room.save()