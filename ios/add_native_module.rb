#!/usr/bin/env ruby

require 'xcodeproj'

project_path = 'PitchPerfect.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Get the PitchPerfect group
main_group = project.main_group.find_subpath('PitchPerfect', true)

# Add PitchDetectorModule.swift
swift_file_ref = main_group.new_file('PitchDetectorModule.swift')
target.source_build_phase.add_file_reference(swift_file_ref)

# Add PitchDetectorBridge.m
bridge_file_ref = main_group.new_file('PitchDetectorBridge.m')
target.source_build_phase.add_file_reference(bridge_file_ref)

# Save the project
project.save

puts "Successfully added PitchDetectorModule.swift and PitchDetectorBridge.m to the Xcode project"
