import 'package:flutter/material.dart';
import '../models/activity.dart';
import '../services/comments_service.dart';

class ActivityDetailScreen extends StatefulWidget {
  final Activity activity;

  const ActivityDetailScreen({super.key, required this.activity});

  @override
  State<ActivityDetailScreen> createState() => _ActivityDetailScreenState();
}

class _ActivityDetailScreenState extends State<ActivityDetailScreen> {
  final CommentsService _commentsService = CommentsService();
  final TextEditingController _messageController = TextEditingController();
  List<dynamic> _comments = [];
  bool _isLoading = true;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _loadComments();
  }

  Future<void> _loadComments() async {
    final comments = await _commentsService.getComments(widget.activity.id);
    if (mounted) {
      setState(() {
        _comments = comments;
        _isLoading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isSending = true);
    final success = await _commentsService.createComment(widget.activity.id, text);
    if (success) {
      _messageController.clear();
      await _loadComments();
    }
    setState(() => _isSending = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      backgroundColor: const Color(0xFF0A101D),
      appBar: AppBar(
        title: const Text('Detalle de Actividad', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF15233D),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Activity Info Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: const Color(0xFF15233D),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.activity.title,
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    '${widget.activity.projectName ?? "Sin proyecto"} • ${widget.activity.companyName ?? "Sin empresa"}',
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF20CDFE).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          widget.activity.status.toUpperCase(),
                          style: const TextStyle(
                              color: Color(0xFF20CDFE), fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
            
            // Comments List
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF20CDFE)))
                  : _comments.isEmpty
                      ? const Center(
                          child: Text(
                            'No hay comentarios aún',
                            style: TextStyle(color: Colors.white54),
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _comments.length,
                          itemBuilder: (context, index) {
                            final comment = _comments[index];
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: const Color(0xFF15233D),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    comment['user']?['name'] ?? 'Usuario',
                                    style: const TextStyle(
                                        color: Color(0xFF20CDFE), fontWeight: FontWeight.bold, fontSize: 12),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    comment['content'] ?? '',
                                    style: const TextStyle(color: Colors.white),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
            ),

            // Message Input Box — always visible above keyboard
            Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              decoration: BoxDecoration(
                color: const Color(0xFF15233D),
                border: Border(top: BorderSide(color: Colors.white.withOpacity(0.1))),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      style: const TextStyle(color: Colors.white),
                      maxLines: 4,
                      minLines: 1,
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _isSending ? null : _sendMessage(),
                      decoration: InputDecoration(
                        hintText: 'Escribe un comentario...',
                        hintStyle: const TextStyle(color: Colors.white54),
                        filled: true,
                        fillColor: const Color(0xFF0A101D),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: const Color(0xFF20CDFE),
                    child: IconButton(
                      icon: _isSending
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.black, strokeWidth: 2),
                            )
                          : const Icon(Icons.send, color: Colors.black),
                      onPressed: _isSending ? null : _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
