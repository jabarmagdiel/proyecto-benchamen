import 'package:flutter/material.dart';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../services/activity_service.dart';
import '../services/projects_service.dart';
import '../services/api_service.dart';
import '../models/activity.dart';
import '../models/project.dart';
import 'activity_detail_screen.dart';

import 'dart:async';
import '../services/websocket_service.dart';

class ActivitiesAdminScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const ActivitiesAdminScreen({super.key, this.onMenuPressed});

  @override
  State<ActivitiesAdminScreen> createState() => _ActivitiesAdminScreenState();
}

class _ActivitiesAdminScreenState extends State<ActivitiesAdminScreen> {
  final ActivityService _activityService = ActivityService();
  final ProjectsService _projectsService = ProjectsService();
  
  List<Activity> _activities = [];
  List<Project> _projects = [];
  bool _isLoading = true;
  String _filterStatus = '';
  StreamSubscription? _wsSub;

  @override
  void initState() {
    super.initState();
    _loadData();
    _wsSub = WebSocketService().eventStream.listen((event) {
      if (event['entity'] == 'activities' || event['entity'] == 'projects') {
        _loadData();
      }
    });
  }

  @override
  void dispose() {
    _wsSub?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final params = _filterStatus.isNotEmpty ? {'status': _filterStatus} : <String, dynamic>{};
      final activities = await _activityService.getAllActivities(params: params);
      final projects = await _projectsService.getProjects();
      setState(() {
        _activities = activities;
        _projects = projects;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _downloadReport(String format) async {
    setState(() => _isLoading = true);
    try {
      final api = ApiService();
      String query = '';
      if (_filterStatus.isNotEmpty) {
        query = '?status=$_filterStatus';
      }
      final bytes = await api.downloadFile('/reports/activities/$format$query');
      
      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/reporte_actividades_$format.${format == 'excel' ? 'xlsx' : 'pdf'}');
      await file.writeAsBytes(bytes);
      
      setState(() => _isLoading = false);
      
      if (mounted) {
        await Share.shareXFiles(
          [XFile(file.path)],
          text: 'Reporte de Actividades ($format)',
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error descargando reporte: $e')));
    }
  }

  void _showActivityModal([Activity? activity]) {
    final isEditing = activity != null;
    final titleController = TextEditingController(text: activity?.title ?? '');
    final descController = TextEditingController(text: activity?.description ?? '');
    int? selectedProjectId = activity?.projectId;

    if (!isEditing && _projects.isNotEmpty) {
      selectedProjectId = _projects.first.id;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF15233D),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
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
                    Text(isEditing ? 'Editar Actividad' : 'Nueva Actividad', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    
                    const Text('Proyecto *', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(color: const Color(0xFF0A101D), borderRadius: BorderRadius.circular(12)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<int>(
                          value: selectedProjectId,
                          isExpanded: true,
                          dropdownColor: const Color(0xFF0A101D),
                          style: const TextStyle(color: Colors.white),
                          items: _projects.map((p) => DropdownMenuItem<int>(value: p.id, child: Text(p.name))).toList(),
                          onChanged: (val) => setModalState(() => selectedProjectId = val),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    
                    _buildTextField('Título *', titleController),
                    _buildTextField('Descripción', descController),
                    
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
                          if (titleController.text.isEmpty || selectedProjectId == null) return;
                          Navigator.pop(context);
                          setState(() => _isLoading = true);
                          try {
                            final data = {
                              'title': titleController.text,
                              'description': descController.text,
                              'project_id': selectedProjectId,
                            };
                            if (isEditing) {
                              await _activityService.updateActivity(activity.id, data);
                            } else {
                              await _activityService.createActivity(data);
                            }
                            _loadData();
                          } catch (e) {
                            setState(() => _isLoading = false);
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                          }
                        },
                        child: Text(isEditing ? 'Guardar Cambios' : 'Crear Actividad', style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            );
          }
        );
      },
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        leading: widget.onMenuPressed != null 
          ? IconButton(icon: const Icon(Icons.menu, color: Colors.white), onPressed: widget.onMenuPressed)
          : null,
        title: const Text('Todas las Actividades', style: TextStyle(color: Colors.white, fontSize: 18)),
        backgroundColor: const Color(0xFF15233D),
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf, color: Colors.redAccent),
            tooltip: 'Descargar PDF',
            onPressed: () => _downloadReport('pdf'),
          ),
          IconButton(
            icon: const Icon(Icons.table_chart, color: Colors.green),
            tooltip: 'Descargar Excel',
            onPressed: () => _downloadReport('excel'),
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list, color: Colors.white),
            onSelected: (val) {
              setState(() => _filterStatus = val);
              _loadData();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: '', child: Text('Todos')),
              const PopupMenuItem(value: 'pendiente', child: Text('Pendientes')),
              const PopupMenuItem(value: 'en_proceso', child: Text('En Progreso')),
              const PopupMenuItem(value: 'en_revision', child: Text('En Revisión')),
              const PopupMenuItem(value: 'aprobada', child: Text('Completadas')),
            ],
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _activities.length,
              itemBuilder: (context, index) {
                final a = _activities[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF15233D).withOpacity(0.8),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF20CDFE).withOpacity(0.15), width: 1),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => ActivityDetailScreen(activity: a)));
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  a.title,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18,
                                  ),
                                ),
                              ),
                              IconButton(
                                constraints: const BoxConstraints(),
                                padding: EdgeInsets.zero,
                                icon: const Icon(Icons.edit, color: Colors.white54, size: 20),
                                onPressed: () => _showActivityModal(a),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              const Icon(Icons.business, color: Colors.white54, size: 16),
                              const SizedBox(width: 6),
                              Text(
                                a.companyName ?? "Sin empresa",
                                style: const TextStyle(color: Colors.white70, fontSize: 14),
                              ),
                              const SizedBox(width: 12),
                              const Icon(Icons.folder, color: Colors.white54, size: 16),
                              const SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  a.projectName ?? "Sin proyecto",
                                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF20CDFE).withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFF20CDFE).withOpacity(0.3)),
                                ),
                                child: Text(
                                  a.status.toUpperCase(),
                                  style: const TextStyle(
                                      color: Color(0xFF20CDFE), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.purpleAccent.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.purpleAccent.withOpacity(0.3)),
                                ),
                                child: Text(
                                  a.priority.toUpperCase(),
                                  style: const TextStyle(
                                      color: Colors.purpleAccent, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF20CDFE),
        onPressed: () => _showActivityModal(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }
}
