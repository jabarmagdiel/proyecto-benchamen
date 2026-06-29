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
    String selectedCycle = package?.billingCycle ?? 'mensual';

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
                    _buildTextField('Precio (\$)', priceController, isNumber: true),
                    
                    const Text('Ciclo de Facturación', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(color: const Color(0xFF0A101D), borderRadius: BorderRadius.circular(12)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: selectedCycle,
                          isExpanded: true,
                          dropdownColor: const Color(0xFF0A101D),
                          style: const TextStyle(color: Colors.white),
                          items: ['mensual', 'anual', 'unico'].map((r) => DropdownMenuItem(value: r, child: Text(r.toUpperCase()))).toList(),
                          onChanged: (val) {
                            if (val != null) setModalState(() => selectedCycle = val);
                          },
                        ),
                      ),
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
                              'price': double.tryParse(priceController.text) ?? 0.0,
                              'billing_cycle': selectedCycle,
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
        title: const Text('Paquetes', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _packages.length,
              itemBuilder: (context, index) {
                final p = _packages[index];
                return Card(
                  color: const Color(0xFF15233D),
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(p.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    subtitle: Text('\$${p.price.toStringAsFixed(2)} - ${p.billingCycle.toUpperCase()}', style: const TextStyle(color: Colors.white54)),
                    trailing: IconButton(
                      icon: const Icon(Icons.edit, color: Colors.white54),
                      onPressed: () => _showPackageModal(p),
                    ),
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
}
