class Appointment {
  final int id;
  final int adminId;
  final int? clientId;
  final String date;
  final String startTime;
  final String endTime;
  final String status; // "available", "booked", "cancelled"
  final String? title;
  final String? notes;
  final String? clientName;
  final String? clientEmail;
  final String? companyName;

  Appointment({
    required this.id,
    required this.adminId,
    this.clientId,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.status,
    this.title,
    this.notes,
    this.clientName,
    this.clientEmail,
    this.companyName,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] ?? 0,
      adminId: json['admin_id'] ?? 0,
      clientId: json['client_id'],
      date: json['date']?.toString() ?? '',
      startTime: json['start_time']?.toString() ?? '',
      endTime: json['end_time']?.toString() ?? '',
      status: json['status']?.toString() ?? 'available',
      title: json['title']?.toString(),
      notes: json['notes']?.toString(),
      clientName: json['client_name']?.toString(),
      clientEmail: json['client_email']?.toString(),
      companyName: json['company_name']?.toString(),
    );
  }
}
