import 'dart:convert';
import 'api_service.dart';
import '../models/appointment.dart';

class AppointmentService {
  final ApiService _apiService = ApiService();

  Future<List<Appointment>> getAvailableSlots({String? date}) async {
    String endpoint = '/appointments/availability';
    if (date != null && date.isNotEmpty) {
      endpoint += '?selected_date=$date';
    }
    final response = await _apiService.get(endpoint);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Appointment.fromJson(json)).toList();
    }
    return [];
  }

  Future<List<Appointment>> getMyAppointments() async {
    final response = await _apiService.get('/appointments/my');
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => Appointment.fromJson(json)).toList();
    }
    return [];
  }

  Future<Appointment> createAvailability({
    required String date,
    required String startTime,
    required String endTime,
  }) async {
    final response = await _apiService.post('/appointments/availability', {
      'date': date,
      'start_time': startTime,
      'end_time': endTime,
    });
    if (response.statusCode == 200 || response.statusCode == 201) {
      return Appointment.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al publicar disponibilidad: ${response.body}');
  }

  Future<Appointment> bookSlot(int id, {required String title, String? notes}) async {
    final response = await _apiService.patch('/appointments/$id/book', {
      'title': title,
      if (notes != null) 'notes': notes,
    });
    if (response.statusCode == 200) {
      return Appointment.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al reservar cita: ${response.body}');
  }

  Future<Appointment> cancelAppointment(int id) async {
    final response = await _apiService.patch('/appointments/$id/cancel', {});
    if (response.statusCode == 200) {
      return Appointment.fromJson(jsonDecode(response.body));
    }
    throw Exception('Error al cancelar cita: ${response.body}');
  }

  Future<void> deleteSlot(int id) async {
    await _apiService.delete('/appointments/$id');
  }
}
