#!/usr/bin/env python3
"""
Sample Profile Seeding Script
Generates diverse sample profiles and projects for development and testing
"""
import asyncio
import argparse
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import sys
import os

# Add the app directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.db import init_db, get_db
from app.models_enhanced import FieldCategory, ExperienceLevel, CollaborationType
from bson import ObjectId
import bcrypt


# Sample data for generating realistic profiles
SAMPLE_NAMES = [
    "Alex Chen", "Sarah Johnson", "Michael Rodriguez", "Emily Davis", "David Kim",
    "Jessica Wilson", "Ryan Patel", "Amanda Thompson", "Kevin Lee", "Lisa Garcia",
    "James Brown", "Maria Gonzalez", "Christopher Taylor", "Ashley Martinez", "Daniel Anderson",
    "Nicole White", "Matthew Jackson", "Stephanie Harris", "Andrew Clark", "Rachel Lewis",
    "Joshua Walker", "Megan Hall", "Brandon Young", "Samantha Allen", "Tyler King",
    "Kayla Wright", "Jordan Lopez", "Brittany Hill", "Austin Scott", "Courtney Green"
]

SAMPLE_BIOS = [
    "Passionate about creating innovative solutions that make a real impact. Always looking for exciting collaboration opportunities.",
    "Creative professional with a love for storytelling and visual design. Experienced in both traditional and digital media.",
    "Tech enthusiast focused on building scalable applications and exploring emerging technologies like AI and blockchain.",
    "Business strategist with a track record of helping startups grow from idea to market success.",
    "Full-stack developer who enjoys working on challenging problems and mentoring junior developers.",
    "UX/UI designer passionate about creating intuitive and beautiful user experiences.",
    "Data scientist with expertise in machine learning and predictive analytics.",
    "Marketing professional specializing in digital campaigns and brand development.",
    "Product manager with experience launching successful consumer and B2B products.",
    "Freelance consultant helping businesses optimize their operations and technology stack.",
    "Creative director with 10+ years in advertising and brand strategy.",
    "Software architect passionate about clean code and system design.",
    "Growth hacker focused on user acquisition and retention strategies.",
    "Content creator and social media strategist with a global audience.",
    "Cybersecurity expert helping organizations protect their digital assets."
]

CITIES = [
    "San Francisco", "New York", "Los Angeles", "Seattle", "Austin",
    "Boston", "Chicago", "Denver", "Portland", "Miami",
    "London", "Berlin", "Amsterdam", "Toronto", "Vancouver",
    "Sydney", "Melbourne", "Tokyo", "Singapore", "Tel Aviv"
]

COUNTRIES = [
    "United States", "Canada", "United Kingdom", "Germany", "Netherlands",
    "Australia", "Japan", "Singapore", "Israel", "France"
]

TIMEZONES = [
    "America/Los_Angeles", "America/New_York", "America/Chicago", "America/Denver",
    "Europe/London", "Europe/Berlin", "Europe/Amsterdam", "Australia/Sydney",
    "Asia/Tokyo", "Asia/Singapore"
]

# Skills by field category
SKILLS_BY_FIELD = {
    FieldCategory.TECH_SOFTWARE: [
        "Python", "JavaScript", "React", "Node.js", "Java", "C++", "Go", "Rust",
        "Docker", "Kubernetes", "AWS", "Git", "MongoDB", "PostgreSQL", "Redis"
    ],
    FieldCategory.TECH_AI: [
        "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "NLP",
        "Computer Vision", "Data Science", "Python", "R", "Jupyter", "Pandas"
    ],
    FieldCategory.CREATIVE_DESIGN: [
        "Adobe Photoshop", "Illustrator", "Figma", "Sketch", "InDesign",
        "Typography", "Branding", "UI Design", "Print Design", "Color Theory"
    ],
    FieldCategory.CREATIVE_VIDEO: [
        "After Effects", "Premiere Pro", "Final Cut Pro", "Cinema 4D", "Blender",
        "Motion Graphics", "Video Editing", "Animation", "Storytelling", "Color Grading"
    ],
    FieldCategory.BUSINESS_MARKETING: [
        "Digital Marketing", "SEO", "SEM", "Social Media", "Content Marketing",
        "Email Marketing", "Analytics", "A/B Testing", "Brand Strategy", "Growth Hacking"
    ],
    FieldCategory.BUSINESS_SALES: [
        "B2B Sales", "CRM", "Lead Generation", "Negotiation", "Account Management",
        "Sales Strategy", "Pipeline Management", "Customer Success", "Salesforce", "HubSpot"
    ]
}

TOOLS_BY_FIELD = {
    FieldCategory.TECH_SOFTWARE: [
        "VS Code", "IntelliJ", "GitHub", "Jira", "Slack", "Postman", "Docker Desktop"
    ],
    FieldCategory.CREATIVE_DESIGN: [
        "Adobe Creative Suite", "Figma", "Sketch", "Canva", "Procreate", "Webflow"
    ],
    FieldCategory.BUSINESS_MARKETING: [
        "Google Analytics", "HubSpot", "Mailchimp", "Hootsuite", "Canva", "Ahrefs"
    ]
}

PROJECT_INTERESTS = [
    "Mobile Apps", "Web Applications", "E-commerce", "SaaS Products", "AI/ML Projects",
    "Blockchain", "IoT", "Gaming", "EdTech", "FinTech", "HealthTech", "CleanTech",
    "Social Impact", "Open Source", "Startups", "Enterprise Solutions", "Creative Projects",
    "Research", "Consulting", "Non-profit", "Community Building"
]

SAMPLE_PROJECTS = [
    {
        "name": "EcoTrack - Sustainability App",
        "description": "Mobile app helping users track and reduce their carbon footprint through gamification",
        "category": "Mobile Apps",
        "industry": "CleanTech",
        "status": "development",
        "team_size": 4
    },
    {
        "name": "CodeMentor Platform",
        "description": "Peer-to-peer learning platform connecting developers for skill sharing",
        "category": "EdTech",
        "industry": "Education",
        "status": "planning",
        "team_size": 3
    },
    {
        "name": "Local Business Directory",
        "description": "Community-focused platform supporting local businesses and entrepreneurs",
        "category": "Web Applications",
        "industry": "Community",
        "status": "completed",
        "team_size": 5
    },
    {
        "name": "AI Content Generator",
        "description": "Tool helping content creators generate ideas and optimize their work",
        "category": "AI/ML Projects",
        "industry": "Creative",
        "status": "development",
        "team_size": 2
    },
    {
        "name": "Remote Team Collaboration Suite",
        "description": "Integrated tools for distributed teams to work effectively together",
        "category": "SaaS Products",
        "industry": "Productivity",
        "status": "launch",
        "team_size": 6
    }
]


def generate_random_profile() -> Dict[str, Any]:
    """Generate a realistic random user profile"""
    name = random.choice(SAMPLE_NAMES)
    field = random.choice(list(FieldCategory))
    experience = random.choice(list(ExperienceLevel))
    
    # Generate skills based on field
    available_skills = SKILLS_BY_FIELD.get(field, ["Communication", "Problem Solving", "Leadership"])
    skills = random.sample(available_skills, min(random.randint(3, 8), len(available_skills)))
    
    # Generate tools
    available_tools = TOOLS_BY_FIELD.get(field, ["Email", "Slack", "Zoom"])
    tools = random.sample(available_tools, min(random.randint(2, 5), len(available_tools)))
    
    # Generate interests
    interests = random.sample(PROJECT_INTERESTS, random.randint(2, 6))
    
    # Generate collaboration types
    collab_types = random.sample(list(CollaborationType), random.randint(1, 3))
    
    city = random.choice(CITIES)
    country = random.choice(COUNTRIES)
    timezone = random.choice(TIMEZONES)
    
    # Generate role based on experience and field
    role_prefixes = {
        ExperienceLevel.STUDENT: ["Student", "Intern", "Junior"],
        ExperienceLevel.JUNIOR: ["Junior", "Associate", "Entry-level"],
        ExperienceLevel.MID: ["", "Mid-level", ""],
        ExperienceLevel.SENIOR: ["Senior", "Lead", "Principal"],
        ExperienceLevel.EXPERT: ["Expert", "Staff", "Distinguished"],
        ExperienceLevel.MENTOR: ["Director", "VP", "Chief"]
    }
    
    role_suffixes = {
        FieldCategory.TECH_SOFTWARE: ["Developer", "Engineer", "Programmer"],
        FieldCategory.TECH_AI: ["Data Scientist", "ML Engineer", "AI Researcher"],
        FieldCategory.CREATIVE_DESIGN: ["Designer", "Creative Director", "Visual Artist"],
        FieldCategory.CREATIVE_VIDEO: ["Video Editor", "Motion Designer", "Filmmaker"],
        FieldCategory.BUSINESS_MARKETING: ["Marketing Manager", "Growth Specialist", "Brand Manager"],
        FieldCategory.BUSINESS_SALES: ["Sales Manager", "Account Executive", "Business Developer"]
    }
    
    prefix = random.choice(role_prefixes.get(experience, [""]))
    suffix = random.choice(role_suffixes.get(field, ["Professional"]))
    role = f"{prefix} {suffix}".strip()
    
    # Generate availability
    availability_hours = random.randint(10, 60)
    
    # Generate personality traits and work style
    personality_traits = random.sample([
        "Collaborative", "Analytical", "Creative", "Detail-oriented", "Innovative",
        "Leadership", "Adaptable", "Communicative", "Problem-solver", "Mentoring"
    ], random.randint(2, 4))
    
    work_style = random.sample([
        "Remote-first", "Flexible hours", "Structured", "Agile", "Independent",
        "Team-oriented", "Fast-paced", "Quality-focused"
    ], random.randint(2, 3))
    
    values = random.sample([
        "Innovation", "Quality", "Collaboration", "Learning", "Impact",
        "Sustainability", "Diversity", "Transparency", "Growth"
    ], random.randint(2, 4))
    
    # Generate timestamps
    created_at = datetime.utcnow() - timedelta(days=random.randint(1, 365))
    last_active = datetime.utcnow() - timedelta(hours=random.randint(0, 72))
    
    profile = {
        "name": name,
        "email": f"{name.lower().replace(' ', '.')}@example.com",
        "password": bcrypt.hashpw("password123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "field": field.value,
        "role": role,
        "experience_level": experience.value,
        "skills": skills,
        "tools": tools,
        "looking_for": [random.choice(list(FieldCategory)).value for _ in range(random.randint(1, 3))],
        "collaboration_type": [ct.value for ct in collab_types],
        "project_interests": interests,
        "bio": random.choice(SAMPLE_BIOS),
        "languages": ["English"] + (["Spanish"] if random.random() > 0.7 else []),
        "location_city": city,
        "location_country": country,
        "timezone": timezone,
        "remote_only": random.random() > 0.6,
        "availability_hours_per_week": availability_hours,
        "availability_start_date": created_at + timedelta(days=random.randint(0, 30)),
        "personality_traits": personality_traits,
        "work_style": work_style,
        "values": values,
        "profile_photo_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={name.replace(' ', '')}",
        "email_verified": random.random() > 0.2,
        "identity_verified": random.random() > 0.5,
        "trust_score": random.uniform(0.3, 1.0),
        "is_premium": random.random() > 0.8,
        "created_at": created_at,
        "updated_at": last_active,
        "last_active": last_active,
        "profile_completion": random.uniform(0.6, 1.0)
    }
    
    return profile


def generate_sample_project(users: List[Dict]) -> Dict[str, Any]:
    """Generate a sample project with team members"""
    project_template = random.choice(SAMPLE_PROJECTS)
    
    # Select random team members
    team_size = min(project_template["team_size"], len(users))
    team_members = random.sample(users, team_size)
    
    project = {
        "name": project_template["name"],
        "description": project_template["description"],
        "category": project_template["category"],
        "industry": project_template["industry"],
        "status": project_template["status"],
        "team_members": [str(user["_id"]) for user in team_members],
        "team_roles": {
            str(user["_id"]): f"{user['role']}" for user in team_members
        },
        "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 180)),
        "updated_at": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
        "tags": random.sample(PROJECT_INTERESTS, random.randint(2, 5)),
        "visibility": "public",
        "budget_range": random.choice(["$0-1k", "$1k-5k", "$5k-10k", "$10k+", "Equity only"]),
        "timeline": random.choice(["1-2 weeks", "1 month", "2-3 months", "6+ months"]),
        "remote_friendly": random.random() > 0.3
    }
    
    return project


async def create_sample_connections(users: List[Dict], db) -> None:
    """Create sample connections between users"""
    connections_collection = db.connections
    
    connection_types = ["colleague", "collaborator", "mentor", "mentee", "friend", "professional"]
    
    # Create connections for each user
    for user in users:
        user_id = str(user["_id"])
        
        # Each user gets 3-8 random connections
        num_connections = random.randint(3, 8)
        potential_connections = [u for u in users if str(u["_id"]) != user_id]
        
        if len(potential_connections) >= num_connections:
            connected_users = random.sample(potential_connections, num_connections)
            
            for connected_user in connected_users:
                connected_user_id = str(connected_user["_id"])
                
                # Check if connection already exists
                existing = await connections_collection.find_one({
                    "user_id": user_id,
                    "connected_user_id": connected_user_id
                })
                
                if not existing:
                    connection_doc = {
                        "user_id": user_id,
                        "connected_user_id": connected_user_id,
                        "connection_type": random.choice(connection_types),
                        "status": "active",
                        "connected_at": datetime.utcnow() - timedelta(days=random.randint(1, 90)),
                        "last_interaction": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                        "tags": random.sample(["work", "networking", "friend", "mentor", "project"], random.randint(0, 2)),
                        "notes": ""
                    }
                    
                    await connections_collection.insert_one(connection_doc)


async def create_sample_posts(users: List[Dict], projects: List[Dict], db) -> None:
    """Create sample feed posts"""
    posts_collection = db.posts
    
    post_types = ["update", "talent-request", "event", "showcase", "milestone", "opportunity"]
    
    sample_post_content = {
        "update": [
            "Just finished an amazing project with my team! Learned so much about modern web development.",
            "Excited to announce that our app just hit 10,000 users! 🎉",
            "Looking forward to the tech conference next week. Anyone else attending?",
            "Just published a new blog post about best practices in software architecture."
        ],
        "talent-request": [
            "Looking for a talented UI/UX designer to join our startup team!",
            "Seeking a full-stack developer for an exciting fintech project.",
            "Need a marketing specialist to help launch our new product.",
            "Looking for a data scientist to join our AI research team."
        ],
        "showcase": [
            "Proud to share our latest project - a sustainability tracking app!",
            "Check out this interactive data visualization we built for climate research.",
            "Our team just launched a new e-commerce platform with amazing results!",
            "Excited to showcase our award-winning mobile app design."
        ]
    }
    
    # Create 30-50 sample posts
    num_posts = random.randint(30, 50)
    
    for _ in range(num_posts):
        author = random.choice(users)
        post_type = random.choice(post_types)
        
        # Get sample content for this post type
        content_options = sample_post_content.get(post_type, ["Great day working on exciting projects!"])
        content_text = random.choice(content_options)
        
        # Add project reference for some posts
        project_ref = None
        if random.random() > 0.6 and projects:
            project = random.choice(projects)
            if str(author["_id"]) in project["team_members"]:
                project_ref = {
                    "id": str(project["_id"]),
                    "name": project["name"],
                    "industry": project["industry"]
                }
        
        post_doc = {
            "type": post_type,
            "author": {
                "id": str(author["_id"]),
                "name": author["name"],
                "avatar": author.get("profile_photo_url", ""),
                "role": author.get("role", ""),
                "field": author.get("field", ""),
                "verified": author.get("identity_verified", False)
            },
            "content": {
                "text": content_text,
                "tags": random.sample(PROJECT_INTERESTS, random.randint(1, 4)),
                "mentions": []
            },
            "project": project_ref,
            "visibility": "public",
            "timestamp": datetime.utcnow() - timedelta(hours=random.randint(0, 168)),  # Last week
            "likes": random.sample([str(u["_id"]) for u in users], random.randint(0, 15)),
            "bookmarks": random.sample([str(u["_id"]) for u in users], random.randint(0, 8)),
            "shares": random.sample([str(u["_id"]) for u in users], random.randint(0, 5)),
            "view_count": random.randint(10, 500),
            "comment_count": random.randint(0, 20),
            "media_urls": [],
            "tags": random.sample(["tech", "startup", "design", "ai", "collaboration"], random.randint(1, 3))
        }
        
        await posts_collection.insert_one(post_doc)


async def seed_database(num_profiles: int = 25, environment: str = "dev"):
    """Main seeding function"""
    print(f"🌱 Starting database seeding for {environment} environment...")
    print(f"📊 Generating {num_profiles} sample profiles...")
    
    try:
        # Initialize database connection
        await init_db()
        db = await get_db()
        
        # Collections
        users_collection = db.users
        projects_collection = db.projects
        
        # Clear existing data in development
        if environment == "dev":
            print("🧹 Clearing existing sample data...")
            await users_collection.delete_many({"email": {"$regex": "@example.com$"}})
            await projects_collection.delete_many({"name": {"$in": [p["name"] for p in SAMPLE_PROJECTS]}})
            await db.connections.delete_many({})
            await db.posts.delete_many({})
        
        # Generate and insert user profiles
        print("👥 Creating user profiles...")
        users = []
        for i in range(num_profiles):
            profile = generate_random_profile()
            result = await users_collection.insert_one(profile)
            profile["_id"] = result.inserted_id
            users.append(profile)
            
            if (i + 1) % 5 == 0:
                print(f"   Created {i + 1}/{num_profiles} profiles...")
        
        print(f"✅ Created {len(users)} user profiles")
        
        # Generate sample projects
        print("🚀 Creating sample projects...")
        projects = []
        for i in range(len(SAMPLE_PROJECTS)):
            project = generate_sample_project(users)
            result = await projects_collection.insert_one(project)
            project["_id"] = result.inserted_id
            projects.append(project)
        
        print(f"✅ Created {len(projects)} sample projects")
        
        # Create connections between users
        print("🤝 Creating user connections...")
        await create_sample_connections(users, db)
        
        connection_count = await db.connections.count_documents({})
        print(f"✅ Created {connection_count} connections")
        
        # Create sample posts
        print("📝 Creating feed posts...")
        await create_sample_posts(users, projects, db)
        
        post_count = await db.posts.count_documents({})
        print(f"✅ Created {post_count} feed posts")
        
        # Create some sample matches
        print("💫 Creating sample matches...")
        matches_collection = db.matches
        
        # Create matches between users with similar fields
        for i in range(min(20, len(users) // 2)):
            user1 = users[i * 2]
            user2 = users[i * 2 + 1]
            
            match_doc = {
                "users": [str(user1["_id"]), str(user2["_id"])],
                "ai_score": random.uniform(0.6, 0.95),
                "score_breakdown": {
                    "skills": random.uniform(0.5, 1.0),
                    "experience": random.uniform(0.4, 0.9),
                    "location": random.uniform(0.3, 1.0),
                    "availability": random.uniform(0.6, 1.0)
                },
                "match_reasons": [
                    f"Shared expertise in {random.choice(user1['skills'])}",
                    "Compatible availability schedules",
                    "Similar project interests"
                ],
                "created_at": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                "status": "active",
                "messages_count": random.randint(0, 15),
                "last_message_at": datetime.utcnow() - timedelta(days=random.randint(0, 7)) if random.random() > 0.3 else None
            }
            
            await matches_collection.insert_one(match_doc)
        
        match_count = await matches_collection.count_documents({})
        print(f"✅ Created {match_count} sample matches")
        
        print("\n🎉 Database seeding completed successfully!")
        print(f"📈 Summary:")
        print(f"   • {len(users)} user profiles")
        print(f"   • {len(projects)} projects")
        print(f"   • {connection_count} connections")
        print(f"   • {post_count} feed posts")
        print(f"   • {match_count} matches")
        
        # Print some sample login credentials
        print(f"\n🔑 Sample login credentials:")
        for i in range(min(5, len(users))):
            user = users[i]
            print(f"   • {user['email']} / password123")
        
    except Exception as e:
        print(f"❌ Error during seeding: {str(e)}")
        raise


def main():
    """Command line interface"""
    parser = argparse.ArgumentParser(description="Seed ALLIV database with sample profiles and data")
    parser.add_argument("--env", choices=["dev", "staging", "test"], default="dev",
                       help="Environment to seed (default: dev)")
    parser.add_argument("--profiles", type=int, default=25,
                       help="Number of profiles to generate (default: 25)")
    parser.add_argument("--clear", action="store_true",
                       help="Clear existing sample data before seeding")
    
    args = parser.parse_args()
    
    if args.env == "staging" and not args.clear:
        confirm = input("⚠️  You're about to seed the staging environment. Continue? (y/N): ")
        if confirm.lower() != 'y':
            print("Seeding cancelled.")
            return
    
    # Run the seeding
    asyncio.run(seed_database(args.profiles, args.env))


if __name__ == "__main__":
    main()






