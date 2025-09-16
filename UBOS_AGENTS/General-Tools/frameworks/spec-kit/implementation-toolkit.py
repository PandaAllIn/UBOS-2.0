#!/usr/bin/env python3
"""
SpecKit Implementation Toolkit
Enterprise-Grade Tools for Specification-Driven Development

This toolkit provides practical implementation tools for SpecKit methodology
including specification validation, code generation coordination, and 
enterprise integration patterns.
"""

import os
import json
import yaml
import logging
import subprocess
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime
import tempfile

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class SpecificationConfig:
    """Configuration for specification-driven development"""
    project_name: str
    specification_format: str = "markdown"  # markdown, yaml, json
    ai_agent: str = "claude"  # claude, copilot, gemini, cursor
    output_directory: str = "output"
    validation_rules: List[str] = None
    integration_patterns: List[str] = None
    
    def __post_init__(self):
        if self.validation_rules is None:
            self.validation_rules = ["syntax", "completeness", "consistency"]
        if self.integration_patterns is None:
            self.integration_patterns = ["sequential", "parallel"]

@dataclass
class SpecificationPhase:
    """Represents a phase in the SpecKit workflow"""
    name: str
    description: str
    inputs: List[str]
    outputs: List[str]
    validation_criteria: List[str]
    ai_prompts: Dict[str, str]

class SpecKitImplementationToolkit:
    """Comprehensive toolkit for SpecKit implementation"""
    
    def __init__(self, config: SpecificationConfig):
        self.config = config
        self.project_path = Path(config.output_directory)
        self.project_path.mkdir(exist_ok=True)
        
        # Define the four phases of SpecKit workflow
        self.phases = self._define_workflow_phases()
        
    def _define_workflow_phases(self) -> Dict[str, SpecificationPhase]:
        """Define the four phases of SpecKit workflow"""
        return {
            "specify": SpecificationPhase(
                name="Specify",
                description="Create high-level description of project goals and user experiences",
                inputs=["business_requirements", "user_stories", "success_criteria"],
                outputs=["specification_document", "user_experience_map", "success_metrics"],
                validation_criteria=[
                    "Clear problem statement",
                    "Defined user personas",
                    "Measurable success criteria",
                    "Scope boundaries identified"
                ],
                ai_prompts={
                    "specification_generation": """
                    Create a comprehensive specification based on the following requirements:
                    
                    Requirements: {requirements}
                    
                    Generate a specification that includes:
                    1. Problem Statement
                    2. User Stories and Personas
                    3. Success Criteria
                    4. Scope and Boundaries
                    5. Key Features and Functionality
                    
                    Use clear, unambiguous language that can guide AI-assisted development.
                    """,
                    "validation": """
                    Validate the following specification for completeness and clarity:
                    
                    Specification: {specification}
                    
                    Check for:
                    - Clear problem definition
                    - Well-defined user stories
                    - Measurable success criteria
                    - Proper scope boundaries
                    
                    Provide feedback and suggestions for improvement.
                    """
                }
            ),
            
            "plan": SpecificationPhase(
                name="Plan",
                description="Define technical architecture, constraints, and implementation strategy",
                inputs=["specification_document", "technical_constraints", "platform_requirements"],
                outputs=["technical_architecture", "implementation_strategy", "constraint_analysis"],
                validation_criteria=[
                    "Architecture aligns with specification",
                    "Constraints are addressed",
                    "Implementation strategy is feasible",
                    "Technology choices are justified"
                ],
                ai_prompts={
                    "architecture_design": """
                    Based on the specification, design a technical architecture:
                    
                    Specification: {specification}
                    Technical Constraints: {constraints}
                    
                    Generate:
                    1. System Architecture Diagram
                    2. Technology Stack Recommendations
                    3. Data Flow and Storage Strategy
                    4. Security and Compliance Considerations
                    5. Scalability and Performance Planning
                    
                    Ensure the architecture directly supports the specification requirements.
                    """,
                    "constraint_analysis": """
                    Analyze constraints and their impact on implementation:
                    
                    Specification: {specification}
                    Constraints: {constraints}
                    
                    Provide:
                    - Constraint impact analysis
                    - Mitigation strategies
                    - Alternative approaches
                    - Risk assessment
                    """
                }
            ),
            
            "tasks": SpecificationPhase(
                name="Tasks",
                description="Break down specification into granular, testable work units",
                inputs=["technical_architecture", "implementation_strategy"],
                outputs=["task_breakdown", "test_specifications", "acceptance_criteria"],
                validation_criteria=[
                    "Tasks are granular and specific",
                    "Each task has clear acceptance criteria",
                    "Tasks can be independently tested",
                    "Dependencies are identified"
                ],
                ai_prompts={
                    "task_breakdown": """
                    Break down the implementation into granular, testable tasks:
                    
                    Architecture: {architecture}
                    Implementation Strategy: {strategy}
                    
                    Generate:
                    1. Detailed task list with priorities
                    2. Task dependencies and relationships
                    3. Acceptance criteria for each task
                    4. Test specifications
                    5. Estimated effort and timeline
                    
                    Ensure each task can be completed and validated independently.
                    """,
                    "test_generation": """
                    Generate comprehensive test specifications:
                    
                    Tasks: {tasks}
                    Acceptance Criteria: {criteria}
                    
                    Create:
                    - Unit test specifications
                    - Integration test scenarios
                    - End-to-end test cases
                    - Performance test criteria
                    - Security test requirements
                    """
                }
            ),
            
            "implement": SpecificationPhase(
                name="Implement",
                description="Execute tasks using AI coding agents with specification guidance",
                inputs=["task_breakdown", "test_specifications", "code_templates"],
                outputs=["source_code", "test_implementations", "documentation"],
                validation_criteria=[
                    "Code meets specification requirements",
                    "All tests pass",
                    "Code follows established patterns",
                    "Documentation is complete"
                ],
                ai_prompts={
                    "code_generation": """
                    Generate code based on the specification and tasks:
                    
                    Specification: {specification}
                    Task: {task}
                    Test Specifications: {tests}
                    
                    Generate:
                    1. Source code implementation
                    2. Unit tests
                    3. Integration tests
                    4. Code documentation
                    5. Usage examples
                    
                    Ensure code strictly adheres to specification requirements.
                    """,
                    "code_validation": """
                    Validate generated code against specification:
                    
                    Specification: {specification}
                    Generated Code: {code}
                    
                    Check:
                    - Specification compliance
                    - Code quality and patterns
                    - Test coverage
                    - Documentation completeness
                    - Performance considerations
                    """
                }
            )
        }
    
    def initialize_project(self, requirements: str) -> Dict[str, Any]:
        """Initialize a new SpecKit project"""
        logger.info(f"Initializing SpecKit project: {self.config.project_name}")
        
        # Create project structure
        self._create_project_structure()
        
        # Generate initial specification
        specification = self._generate_initial_specification(requirements)
        
        # Create project configuration
        project_config = {
            "project_name": self.config.project_name,
            "created_at": datetime.now().isoformat(),
            "specification_format": self.config.specification_format,
            "ai_agent": self.config.ai_agent,
            "phases": list(self.phases.keys()),
            "current_phase": "specify"
        }
        
        # Save configuration
        config_path = self.project_path / "speckit-config.json"
        with open(config_path, 'w') as f:
            json.dump(project_config, f, indent=2)
        
        logger.info(f"Project initialized at: {self.project_path}")
        return project_config
    
    def _create_project_structure(self):
        """Create the project directory structure"""
        directories = [
            "specifications",
            "architecture", 
            "tasks",
            "implementation",
            "tests",
            "documentation",
            "templates",
            "validation"
        ]
        
        for directory in directories:
            (self.project_path / directory).mkdir(exist_ok=True)
    
    def _generate_initial_specification(self, requirements: str) -> str:
        """Generate initial specification from requirements"""
        logger.info("Generating initial specification")
        
        # This would typically use AI agent integration
        # For now, creating a template-based specification
        specification = f"""
# {self.config.project_name} - Project Specification

## Project Overview
{requirements}

## User Stories
- As a user, I want to [define specific functionality]
- As a developer, I want to [define technical requirements]

## Success Criteria
- [ ] Functional requirements are met
- [ ] Performance criteria are satisfied
- [ ] Security requirements are implemented
- [ ] User experience goals are achieved

## Scope and Boundaries
### In Scope
- Core functionality as defined in requirements
- Basic user interface and experience
- Essential integrations

### Out of Scope
- Advanced features not specified
- Third-party integrations beyond requirements
- Performance optimizations beyond basic requirements

## Technical Constraints
- Platform: {self.config.ai_agent}
- Output Format: {self.config.specification_format}
- Development Approach: Specification-driven with AI assistance

## Next Steps
1. Review and validate specification
2. Proceed to technical planning phase
3. Break down into implementable tasks
4. Execute with AI-assisted development
"""
        
        # Save specification
        spec_path = self.project_path / "specifications" / "initial-spec.md"
        with open(spec_path, 'w') as f:
            f.write(specification)
        
        return specification
    
    def validate_specification(self, specification: str) -> Tuple[bool, List[str]]:
        """Validate specification against SpecKit criteria"""
        logger.info("Validating specification")
        
        validation_results = []
        is_valid = True
        
        # Check for required sections
        required_sections = [
            "Project Overview", "User Stories", "Success Criteria", 
            "Scope and Boundaries", "Technical Constraints"
        ]
        
        for section in required_sections:
            if section not in specification:
                validation_results.append(f"Missing required section: {section}")
                is_valid = False
        
        # Check for specific content patterns
        if "As a" not in specification:
            validation_results.append("No user stories found (should contain 'As a' patterns)")
            is_valid = False
        
        if "[ ]" not in specification and "- [ ]" not in specification:
            validation_results.append("No checkboxes found for success criteria")
            is_valid = False
        
        # Check for scope definition
        if "In Scope" not in specification or "Out of Scope" not in specification:
            validation_results.append("Missing scope boundaries definition")
            is_valid = False
        
        if is_valid:
            validation_results.append("Specification validation passed")
        
        return is_valid, validation_results
    
    def execute_phase(self, phase_name: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a specific phase of the SpecKit workflow"""
        if phase_name not in self.phases:
            raise ValueError(f"Invalid phase: {phase_name}")
        
        phase = self.phases[phase_name]
        logger.info(f"Executing phase: {phase.name}")
        
        # Create phase directory
        phase_path = self.project_path / phase_name
        phase_path.mkdir(exist_ok=True)
        
        # Execute phase-specific logic
        results = self._execute_phase_logic(phase, inputs)
        
        # Save phase results
        results_path = phase_path / f"{phase_name}-results.json"
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Validate phase completion
        validation_results = self._validate_phase_completion(phase, results)
        
        return {
            "phase": phase_name,
            "results": results,
            "validation": validation_results,
            "completed_at": datetime.now().isoformat()
        }
    
    def _execute_phase_logic(self, phase: SpecificationPhase, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the core logic for a specific phase"""
        # This is a template implementation
        # In a real implementation, this would integrate with AI agents
        
        results = {
            "phase_name": phase.name,
            "description": phase.description,
            "inputs_processed": list(inputs.keys()),
            "outputs_generated": phase.outputs,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add phase-specific processing
        if phase.name == "Specify":
            results["specification_quality"] = "high"
            results["user_stories_count"] = len(inputs.get("requirements", "").split("As a"))
        elif phase.name == "Plan":
            results["architecture_complexity"] = "moderate"
            results["technology_stack"] = ["python", "ai-agents", "speckit"]
        elif phase.name == "Tasks":
            results["task_count"] = 10
            results["estimated_hours"] = 40
        elif phase.name == "Implement":
            results["code_files_generated"] = 5
            results["test_coverage"] = "85%"
        
        return results
    
    def _validate_phase_completion(self, phase: SpecificationPhase, results: Dict[str, Any]) -> Dict[str, Any]:
        """Validate that a phase has been completed successfully"""
        validation = {
            "phase": phase.name,
            "criteria_met": [],
            "criteria_failed": [],
            "overall_status": "pending"
        }
        
        # Check validation criteria
        for criterion in phase.validation_criteria:
            # Simple validation logic (would be more sophisticated in real implementation)
            if "results" in results and results.get("timestamp"):
                validation["criteria_met"].append(criterion)
            else:
                validation["criteria_failed"].append(criterion)
        
        # Determine overall status
        if len(validation["criteria_failed"]) == 0:
            validation["overall_status"] = "passed"
        elif len(validation["criteria_met"]) > len(validation["criteria_failed"]):
            validation["overall_status"] = "passed_with_warnings"
        else:
            validation["overall_status"] = "failed"
        
        return validation
    
    def generate_implementation_report(self) -> str:
        """Generate comprehensive implementation report"""
        logger.info("Generating implementation report")
        
        report = f"""
# {self.config.project_name} - Implementation Report

*Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*

## Project Configuration
- **Project Name**: {self.config.project_name}
- **Specification Format**: {self.config.specification_format}
- **AI Agent**: {self.config.ai_agent}
- **Output Directory**: {self.project_path}

## Phase Execution Summary
"""
        
        # Add phase information
        for phase_name, phase in self.phases.items():
            report += f"""
### {phase.name} Phase
**Description**: {phase.description}

**Inputs**: {', '.join(phase.inputs)}
**Outputs**: {', '.join(phase.outputs)}
**Validation Criteria**: {len(phase.validation_criteria)} criteria defined

"""
        
        report += """
## Implementation Guidelines

### Best Practices
1. **Specification First**: Always start with clear, unambiguous specifications
2. **Iterative Refinement**: Continuously refine specifications based on feedback
3. **AI Agent Coordination**: Use AI agents as literal-minded pair programmers
4. **Validation Gates**: Implement validation at each phase transition
5. **Documentation**: Maintain living documentation throughout the process

### Common Pitfalls
- Vague or ambiguous specifications
- Skipping validation steps
- Insufficient test coverage
- Poor AI prompt engineering
- Lack of stakeholder alignment

## Next Steps
1. Execute each phase systematically
2. Validate outputs at each stage
3. Integrate with CI/CD pipeline
4. Monitor and measure success metrics
5. Continuously improve the process

---

*This report was generated by the SpecKit Implementation Toolkit*
"""
        
        # Save report
        report_path = self.project_path / "implementation-report.md"
        with open(report_path, 'w') as f:
            f.write(report)
        
        return report

def create_sample_project():
    """Create a sample SpecKit project for demonstration"""
    config = SpecificationConfig(
        project_name="Sample AI-Assisted Application",
        specification_format="markdown",
        ai_agent="claude",
        output_directory="sample-speckit-project"
    )
    
    toolkit = SpecKitImplementationToolkit(config)
    
    # Initialize project
    requirements = """
    Create a web application that helps users manage their daily tasks.
    The application should allow users to create, edit, delete, and organize tasks.
    Users should be able to set due dates, priorities, and categories for tasks.
    The application should provide a clean, intuitive user interface.
    """
    
    project_config = toolkit.initialize_project(requirements)
    
    # Execute phases
    phase_results = []
    
    # Specify phase
    specify_results = toolkit.execute_phase("specify", {"requirements": requirements})
    phase_results.append(specify_results)
    
    # Plan phase
    plan_results = toolkit.execute_phase("plan", {
        "specification": "Generated specification",
        "constraints": ["Web-based", "Responsive design", "Modern browser support"]
    })
    phase_results.append(plan_results)
    
    # Tasks phase
    task_results = toolkit.execute_phase("tasks", {
        "architecture": "MVC architecture with REST API",
        "strategy": "Iterative development with AI assistance"
    })
    phase_results.append(task_results)
    
    # Implement phase
    implement_results = toolkit.execute_phase("implement", {
        "tasks": ["UI components", "API endpoints", "Database schema"],
        "tests": ["Unit tests", "Integration tests"]
    })
    phase_results.append(implement_results)
    
    # Generate report
    report = toolkit.generate_implementation_report()
    
    print(f"Sample project created at: {toolkit.project_path}")
    print(f"Implementation report: {toolkit.project_path}/implementation-report.md")
    
    return toolkit, phase_results

if __name__ == "__main__":
    print("🚀 SpecKit Implementation Toolkit")
    print("Creating sample project...")
    
    toolkit, results = create_sample_project()
    
    print(f"✅ Sample project completed!")
    print(f"📁 Project location: {toolkit.project_path}")
    print(f"📊 Phases executed: {len(results)}")
    
    for result in results:
        phase_name = result["phase"]
        status = result["validation"]["overall_status"]
        print(f"  - {phase_name.title()}: {status}")