export const TECHNOLOGIES = [
  // Programming Languages
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'PHP', 'Go', 'SQL',
  'Swift', 'Kotlin', 'Ruby', 'Rust', 'C/C++', 'Scala',
  // Frontend Frameworks
  'React', 'Angular', 'Vue.js', 'Next.js',
  // Java/Spring Ecosystem
  'Spring Boot', 'Spring MVC', 'Spring', 'Hibernate', 'JPA', 'Maven', 'Gradle',
  // Backend Frameworks
  'Node.js', 'Django', '.NET', 'Laravel', 'FastAPI',
  // Mobile
  'React Native', 'Flutter', 'Android', 'iOS',
  // Databases
  'MongoDB', 'Redis', 'PostgreSQL', 'MySQL', 'Oracle DB', 'MS SQL', 'Elasticsearch',
  // Messaging & Streaming
  'Kafka', 'RabbitMQ',
  // DevOps/Cloud
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'CI/CD', 'Linux/Unix', 'Windows',
  // Networking & Protocols
  'HTTP/HTTPS', 'TCP/IP', 'SSL/TLS', 'WebSocket', 'gRPC',
  // API & Integration
  'REST API', 'GraphQL', 'API Gateway', 'Microservices',
  // Authentication & Security
  'Keycloak', 'OAuth', 'JWT',
  // Workflow & BPM
  'Camunda',
  // Concurrency
  'Multithreading',
  // Tools & Version Control
  'Git', '1C',
  // Testing
  'JUnit', 'Selenium', 'Jest',
  // Data & Analytics
  'Power BI', 'Tableau', 'ETL',
] as const

export type TechnologyName = (typeof TECHNOLOGIES)[number]
