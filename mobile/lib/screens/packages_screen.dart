import 'package:flutter/material.dart';
import '../services/packages_service.dart';
import '../models/package_model.dart';

class PackagesScreen extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  const PackagesScreen({super.key, this.onMenuPressed});

  @override
  State<PackagesScreen> createState() => _PackagesScreenState();
}

class _PackagesScreenState extends State<PackagesScreen> {
  final PackagesService _packagesService = PackagesService();
  List<PackageModel> _packages = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPackages();
  }

  Future<void> _loadPackages() async {
    setState(() => _isLoading = true);
    try {
      final data = await _packagesService.getPackages();
      setState(() {
        _packages = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _showPackageModal([PackageModel? package]) {
    final isEditing = package != null;
    final nameController = TextEditingController(text: package?.name ?? '');
    final descController = TextEditingController(text: package?.description ?? '');
    final priceController = TextEditingController(text: package?.price.toString() ?? '');
    final videosController = TextEditingController(text: package?.videosCount.toString() ?? '0');
    final droneController = TextEditingController(text: package?.droneCount.toString() ?? '0');
    final artsController = TextEditingController(text: package?.artsCount.toString() ?? '0');
    final templateArtsController = TextEditingController(text: package?.templateArtsCount.toString() ?? '0');
    bool adManagement = package?.adManagement ?? false;
    bool isActive = package?.isActive ?? true;

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
                    Text(isEditing ? 'Editar Paquete' : 'Nuevo Paquete', style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildTextField('Nombre *', nameController),
                    _buildTextField('Descripción', descController),
                    _buildTextField('Precio Base (Bs.) *', priceController, isNumber: true),

                    const Text('Contenido Mensual', style: TextStyle(color: Color(0xFF20CDFE), fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _buildTextField('Videos', videosController, isNumber: true)),
                        const SizedBox(width: 8),
                        Expanded(child: _buildTextField('Dron', droneController, isNumber: true)),
                      ],
                    ),
                    Row(
                      children: [
                        Expanded(child: _buildTextField('Artes', artsController, isNumber: true)),
                        const SizedBox(width: 8),
                        Expanded(child: _buildTextField('Plantillas', templateArtsController, isNumber: true)),
                      ],
                    ),

                    SwitchListTile(
                      title: const Text('Gestión de Publicidad', style: TextStyle(color: Colors.white, fontSize: 13)),
                      value: adManagement,
                      activeThumbColor: const Color(0xFF20CDFE),
                      onChanged: (val) => setModalState(() => adManagement = val),
                    ),

                    SwitchListTile(
                      title: const Text('Visible a Clientes', style: TextStyle(color: Colors.white, fontSize: 13)),
                      value: isActive,
                      activeThumbColor: const Color(0xFF20CDFE),
                      onChanged: (val) => setModalState(() => isActive = val),
                    ),

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
                          if (nameController.text.isEmpty || priceController.text.isEmpty) return;
                          Navigator.pop(context);
                          setState(() => _isLoading = true);
                          try {
                            final data = {
                              'name': nameController.text,
                              'description': descController.text,
                              'base_price': double.tryParse(priceController.text) ?? 0.0,
                              'videos_count': int.tryParse(videosController.text) ?? 0,
                              'drone_count': int.tryParse(droneController.text) ?? 0,
                              'arts_count': int.tryParse(artsController.text) ?? 0,
                              'template_arts_count': int.tryParse(templateArtsController.text) ?? 0,
                              'ad_management': adManagement,
                              'is_active': isActive,
                            };
                            if (isEditing) {
                              await _packagesService.updatePackage(package.id, data);
                            } else {
                              await _packagesService.createPackage(data);
                            }
                            _loadPackages();
                          } catch (e) {
                            setState(() => _isLoading = false);
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                          }
                        },
                        child: Text(isEditing ? 'Guardar Cambios' : 'Crear Paquete', style: const TextStyle(fontWeight: FontWeight.bold)),
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

  Widget _buildTextField(String label, TextEditingController controller, {bool isNumber = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: isNumber ? const TextInputType.numberWithOptions(decimal: true) : TextInputType.text,
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
        title: const Text('Paquetes y Suscripciones', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: const Color(0xFF15233D),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _packages.length,
              itemBuilder: (context, index) {
                final p = _packages[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF15233D),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: p.isActive ? const Color(0xFF20CDFE).withValues(alpha: 0.2) : Colors.white10),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              p.name,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.edit, color: Colors.white54, size: 20),
                            onPressed: () => _showPackageModal(p),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${p.price.toStringAsFixed(2)} Bs. / mes',
                        style: const TextStyle(color: Color(0xFF20CDFE), fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      if (p.description != null && p.description!.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(p.description!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                      ],
                      const SizedBox(height: 12),
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [
                          _buildBadge('📹 ${p.videosCount} Videos'),
                          _buildBadge('🛸 ${p.droneCount} Dron'),
                          _buildBadge('🎨 ${p.artsCount} Artes'),
                          _buildBadge('🖼️ ${p.templateArtsCount} Plantillas'),
                          if (p.adManagement) _buildBadge('📢 Pub. Incluida', color: Colors.green),
                        ],
                      )
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF20CDFE),
        onPressed: () => _showPackageModal(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }

  Widget _buildBadge(String label, {Color color = const Color(0xFF20CDFE)}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
