import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../services/appointment_service.dart';
import '../models/appointment.dart';

class AgendaScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const AgendaScreen({super.key, this.onMenuPressed});

  @override
  State<AgendaScreen> createState() => _AgendaScreenState();
}

class _AgendaScreenState extends State<AgendaScreen> with SingleTickerProviderStateMixin {
  final AppointmentService _appointmentService = AppointmentService();
  List<Appointment> _availableSlots = [];
  List<Appointment> _myAppointments = [];
  bool _isLoading = true;
  String? _selectedDate; // Format YYYY-MM-DD
  late TabController _tabController;

  // Admin form controllers
  String _selectedStartTime = '09:00';
  String _selectedEndTime = '10:00';

  final List<String> _hours = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    final now = DateTime.now();
    _selectedDate = "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final avail = await _appointmentService.getAvailableSlots(date: _selectedDate);
      final my = await _appointmentService.getMyAppointments();
      if (mounted) {
        setState(() {
          _availableSlots = avail;
          _myAppointments = my;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al cargar agenda: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.parse(_selectedDate ?? now.toString()),
      firstDate: now.subtract(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: Color(0xFF20CDFE),
              onPrimary: Colors.black,
              surface: Color(0xFF15233D),
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _selectedDate = "${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}";
      });
      _loadData();
    }
  }

  void _showBookModal(Appointment slot) {
    final titleController = TextEditingController();
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF15233D),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 20, right: 20, top: 20,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Solicitar Cita / Reunión', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text('Fecha: ${slot.date} (${slot.startTime} - ${slot.endTime})', style: const TextStyle(color: Color(0xFF20CDFE), fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                _buildTextField('Motivo o título de reunión *', titleController),
                _buildTextField('Notas adicionales (opcional)', notesController, maxLines: 3),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF20CDFE),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () async {
                      if (titleController.text.trim().isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('El título es obligatorio')));
                        return;
                      }
                      Navigator.pop(context);
                      setState(() => _isLoading = true);
                      try {
                        await _appointmentService.bookSlot(
                          slot.id,
                          title: titleController.text.trim(),
                          notes: notesController.text.trim().isNotEmpty ? notesController.text.trim() : null,
                        );
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('🎉 ¡Cita reservada exitosamente!'), backgroundColor: Colors.green));
                        _loadData();
                      } catch (e) {
                        setState(() => _isLoading = false);
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al reservar: $e'), backgroundColor: Colors.red));
                      }
                    },
                    child: const Text('Confirmar Cita', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTextField(String label, TextEditingController controller, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.white54),
          filled: true,
          fillColor: const Color(0xFF0A101D),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
        ),
      ),
    );
  }

  Future<void> _publishAvailability() async {
    if (_selectedDate == null) return;
    if (_hours.indexOf(_selectedStartTime) >= _hours.indexOf(_selectedEndTime)) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('La hora de inicio debe ser anterior a la de fin'), backgroundColor: Colors.red));
      return;
    }
    setState(() => _isLoading = true);
    try {
      await _appointmentService.createAvailability(
        date: _selectedDate!,
        startTime: _selectedStartTime,
        endTime: _selectedEndTime,
      );
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('✅ Disponibilidad publicada'), backgroundColor: Colors.green));
      _loadData();
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
    }
  }

  Future<void> _cancelAppointment(int id) async {
    setState(() => _isLoading = true);
    try {
      await _appointmentService.cancelAppointment(id);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cita cancelada'), backgroundColor: Colors.orange));
      _loadData();
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al cancelar: $e'), backgroundColor: Colors.red));
    }
  }

  Future<void> _deleteSlot(int id) async {
    setState(() => _isLoading = true);
    try {
      await _appointmentService.deleteSlot(id);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Ranura eliminada'), backgroundColor: Colors.orange));
      _loadData();
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error al eliminar: $e'), backgroundColor: Colors.red));
    }
  }

  @override
  Widget build(BuildContext context) {
    final authService = Provider.of<AuthService>(context);
    final role = authService.role?.toLowerCase() ?? 'cliente';
    final isAdmin = role == 'admin' || role == 'administrador';

    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        leading: widget.onMenuPressed != null 
          ? IconButton(icon: const Icon(Icons.menu, color: Colors.white), onPressed: widget.onMenuPressed)
          : null,
        title: const Text('Módulo de Calendario / Agenda', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF15233D),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month, color: Color(0xFF20CDFE)),
            onPressed: _pickDate,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white70),
            onPressed: _loadData,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF20CDFE),
          labelColor: const Color(0xFF20CDFE),
          unselectedLabelColor: Colors.white54,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: [
            Tab(text: isAdmin ? 'Disponibles ($_selectedDate)' : 'Horarios Disponibles'),
            Tab(text: isAdmin ? 'Todas las Citas (${_myAppointments.length})' : 'Mis Citas (${_myAppointments.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildAvailableTab(isAdmin),
                _buildMyAppointmentsTab(isAdmin),
              ],
            ),
    );
  }

  Widget _buildAvailableTab(bool isAdmin) {
    return Column(
      children: [
        // Date selector bar
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          color: const Color(0xFF15233D).withOpacity(0.5),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 16, color: Color(0xFF20CDFE)),
                  const SizedBox(width: 8),
                  Text('Fecha seleccionada: $_selectedDate', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                ],
              ),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF20CDFE).withOpacity(0.15),
                  foregroundColor: const Color(0xFF20CDFE),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.edit_calendar, size: 16),
                label: const Text('Cambiar', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                onPressed: _pickDate,
              ),
            ],
          ),
        ),

        // Admin publish bar
        if (isAdmin) ...[
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF15233D),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.white10),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Publicar Disponibilidad', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedStartTime,
                        dropdownColor: const Color(0xFF15233D),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          labelText: 'Inicio',
                          labelStyle: const TextStyle(color: Colors.white54, fontSize: 12),
                          filled: true,
                          fillColor: const Color(0xFF0A101D),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                        ),
                        items: _hours.map((h) => DropdownMenuItem(value: h, child: Text(h))).toList(),
                        onChanged: (val) => setState(() => _selectedStartTime = val!),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _selectedEndTime,
                        dropdownColor: const Color(0xFF15233D),
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: InputDecoration(
                          labelText: 'Fin',
                          labelStyle: const TextStyle(color: Colors.white54, fontSize: 12),
                          filled: true,
                          fillColor: const Color(0xFF0A101D),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
                        ),
                        items: _hours.map((h) => DropdownMenuItem(value: h, child: Text(h))).toList(),
                        onChanged: (val) => setState(() => _selectedEndTime = val!),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF20CDFE),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      onPressed: _publishAvailability,
                      child: const Icon(Icons.add, size: 20),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],

        // Slots grid/list
        Expanded(
          child: _availableSlots.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.calendar_month_outlined, size: 48, color: Colors.white.withOpacity(0.2)),
                      const SizedBox(height: 12),
                      Text(
                        isAdmin ? 'No hay slots publicados en esta fecha.' : 'No hay horarios disponibles en esta fecha.',
                        style: const TextStyle(color: Colors.white54, fontSize: 14),
                      ),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 2.2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                  ),
                  itemCount: _availableSlots.length,
                  itemBuilder: (context, index) {
                    final slot = _availableSlots[index];
                    return Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [const Color(0xFF20CDFE).withOpacity(0.15), const Color(0xFF1ED1B4).withOpacity(0.05)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF20CDFE).withOpacity(0.3)),
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: InkWell(
                          borderRadius: BorderRadius.circular(12),
                          onTap: () {
                            if (!isAdmin) _showBookModal(slot);
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.access_time, size: 14, color: Color(0xFF20CDFE)),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${slot.startTime} - ${slot.endTime}',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  isAdmin ? 'DISPONIBLE' : 'RESERVAR AHORA',
                                  style: TextStyle(
                                    color: isAdmin ? const Color(0xFF1ED1B4) : const Color(0xFF20CDFE),
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildMyAppointmentsTab(bool isAdmin) {
    if (_myAppointments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_busy, size: 48, color: Colors.white.withOpacity(0.2)),
            const SizedBox(height: 12),
            const Text('Aún no hay citas registradas.', style: TextStyle(color: Colors.white54, fontSize: 14)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _myAppointments.length,
      itemBuilder: (context, index) {
        final apt = _myAppointments[index];
        final isBooked = apt.status == 'booked';
        final isCancelled = apt.status == 'cancelled';

        Color badgeColor = const Color(0xFF20CDFE);
        String badgeText = 'Disponible';
        if (isBooked) {
          badgeColor = const Color(0xFF1ED1B4);
          badgeText = 'Reservada';
        } else if (isCancelled) {
          badgeColor = Colors.grey;
          badgeText = 'Cancelada';
        }

        return Card(
          color: const Color(0xFF15233D),
          margin: const EdgeInsets.only(bottom: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: isBooked ? const Color(0xFF1ED1B4).withOpacity(0.4) : Colors.white10),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: badgeColor.withOpacity(0.4)),
                      ),
                      child: Text(
                        badgeText.toUpperCase(),
                        style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today, size: 12, color: Colors.white54),
                        const SizedBox(width: 4),
                        Text(apt.date, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.w600)),
                        const SizedBox(width: 8),
                        const Icon(Icons.access_time, size: 12, color: Color(0xFF20CDFE)),
                        const SizedBox(width: 4),
                        Text('${apt.startTime} - ${apt.endTime}', style: const TextStyle(color: Color(0xFF20CDFE), fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (apt.title != null && apt.title!.isNotEmpty) ...[
                  Text(apt.title!, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                ] else ...[
                  const Text('Reunión de Coordinación', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                ],
                if (apt.notes != null && apt.notes!.isNotEmpty) ...[
                  Text(apt.notes!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 8),
                ],
                if (apt.clientName != null || apt.companyName != null) ...[
                  const Divider(color: Colors.white10, height: 16),
                  Row(
                    children: [
                      const Icon(Icons.person_outline, size: 14, color: Colors.white54),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          '${apt.clientName ?? "Cliente"} · ${apt.companyName ?? "Empresa"}',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (isBooked) ...[
                      TextButton.icon(
                        icon: const Icon(Icons.cancel_outlined, size: 16, color: Colors.redAccent),
                        label: const Text('Cancelar Cita', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: () => _cancelAppointment(apt.id),
                      ),
                    ],
                    if (isAdmin && apt.status == 'available') ...[
                      TextButton.icon(
                        icon: const Icon(Icons.delete_outline, size: 16, color: Colors.redAccent),
                        label: const Text('Eliminar', style: TextStyle(color: Colors.redAccent, fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: () => _deleteSlot(apt.id),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
