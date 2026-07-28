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
  String _selectedCategoryFilter = 'todos';

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
        if (_selectedCategoryFilter == 'todos') {
          _packages = data;
        } else {
          _packages = data.where((p) => p.category == _selectedCategoryFilter).toList();
        }
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
    final priceController = TextEditingController(text: package?.price.toString() ?? '0');
    final priceTextController = TextEditingController(text: package?.priceText ?? 'Por definir en reunión');
    
    String category = package?.category ?? 'marketing';
    String priceType = package?.priceType ?? 'fixed';
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

                    const Text('Categoría', style: TextStyle(color: Colors.white54, fontSize: 12)),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(color: const Color(0xFF0A101D), borderRadius: BorderRadius.circular(12)),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: category,
                          isExpanded: true,
                          dropdownColor: const Color(0xFF0A101D),
                          style: const TextStyle(color: Colors.white),
                          items: const [
                            DropdownMenuItem(value: 'marketing', child: Text('Marketing & Audiovisual')),
                            DropdownMenuItem(value: 'software', child: Text('Software & Sistemas')),
                          ],
                          onChanged: (val) {
                            if (val != null) setModalState(() => category = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    _buildTextField('Nombre *', nameController),
                    _buildTextField('Descripción', descController),

                    Row(
                      children: [
                        Expanded(
                          child: ChoiceChip(
                            label: const Text('Precio Fijo (Bs.)', style: TextStyle(fontSize: 12)),
                            selected: priceType == 'fixed',
                            selectedColor: const Color(0xFF20CDFE),
                            onSelected: (sel) {
                              if (sel) setModalState(() => priceType = 'fixed');
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ChoiceChip(
                            label: const Text('Por definir', style: TextStyle(fontSize: 12)),
                            selected: priceType == 'custom_text',
                            selectedColor: const Color(0xFF20CDFE),
                            onSelected: (sel) {
                              if (sel) setModalState(() => priceType = 'custom_text');
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    if (priceType == 'fixed')
                      _buildTextField('Precio (Bs.)', priceController, isNumber: true)
                    else
                      _buildTextField('Texto de Precio', priceTextController),

                    SwitchListTile(
                      title: const Text('Visible a Clientes', style: TextStyle(color: Colors.white, fontSize: 13)),
                      value: isActive,
                      activeTrackColor: const Color(0xFF20CDFE),
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
                          if (nameController.text.isEmpty) return;
                          Navigator.pop(context);
                          setState(() => _isLoading = true);
                          try {
                            final data = {
                              'name': nameController.text,
                              'description': descController.text,
                              'category': category,
                              'price_type': priceType,
                              'price_text': priceTextController.text,
                              'base_price': priceType == 'fixed' ? (double.tryParse(priceController.text) ?? 0.0) : 0.0,
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
      body: Column(
        children: [
          // Filter Row
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFF15233D).withValues(alpha: 0.5),
            child: Row(
              children: [
                _buildFilterChip('todos', 'Todas'),
                const SizedBox(width: 8),
                _buildFilterChip('marketing', 'Marketing'),
                const SizedBox(width: 8),
                _buildFilterChip('software', 'Software'),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
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
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF20CDFE).withValues(alpha: 0.15),
                                          borderRadius: BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          p.category.toUpperCase(),
                                          style: const TextStyle(color: Color(0xFF20CDFE), fontSize: 10, fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        p.name,
                                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                                      ),
                                    ],
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
                              p.priceType == 'custom_text' ? (p.priceText ?? 'Por definir en reunión') : '${p.price.toStringAsFixed(2)} Bs. / mes',
                              style: TextStyle(
                                color: p.priceType == 'custom_text' ? Colors.amberAccent : const Color(0xFF20CDFE),
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            if (p.description != null && p.description!.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Text(p.description!, style: const TextStyle(color: Colors.white70, fontSize: 12)),
                            ],
                            if (p.items.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              Wrap(
                                spacing: 6,
                                runSpacing: 6,
                                children: p.items.map((item) {
                                  return _buildBadge(
                                    item.itemType == 'por_cantidad' ? '${item.quantity} ${item.name}' : '${item.name} (Plan)',
                                    color: item.itemType == 'por_cantidad' ? const Color(0xFF20CDFE) : Colors.greenAccent,
                                  );
                                }).toList(),
                              ),
                            ]
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: const Color(0xFF20CDFE),
        onPressed: () => _showPackageModal(),
        child: const Icon(Icons.add, color: Colors.black),
      ),
    );
  }

  Widget _buildFilterChip(String id, String label) {
    final isSel = _selectedCategoryFilter == id;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedCategoryFilter = id);
        _loadPackages();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSel ? const Color(0xFF20CDFE).withValues(alpha: 0.2) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isSel ? const Color(0xFF20CDFE) : Colors.white24),
        ),
        child: Text(
          label,
          style: TextStyle(color: isSel ? const Color(0xFF20CDFE) : Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
        ),
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
