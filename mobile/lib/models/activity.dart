class Activity {
  final int id;
  final String title;
  final String? description;
  final String type;
  final String priority;
  final String status;
  final String? projectName;
  final String? companyName;
  final String? deadline;

  Activity({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    required this.priority,
    required this.status,
    this.projectName,
    this.companyName,
    this.deadline,
  });

  factory Activity.fromJson(Map<String, dynamic> json) {
    return Activity(
      id: json['id'],
      title: json['title'],
      description: json['description'],
      type: json['activity_type'],
      priority: json['priority'],
      status: json['status'],
      projectName: json['project_name'],
      companyName: json['company_name'],
      deadline: json['deadline'],
    );
  }
}
