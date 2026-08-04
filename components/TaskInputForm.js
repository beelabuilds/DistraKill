import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Modal,
  Share,
  Clipboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Spacing, Radius, Typography } from '@/constants/auth-theme';
import { useAuthTheme } from '@/hooks/use-auth-theme';

// Safe wrapper for haptic feedback
const triggerHaptic = (style = Haptics.ImpactFeedbackStyle.Light) => {
  try {
    Haptics.impactAsync(style);
  } catch (_e) {
    // Ignore on unsupported platforms (like Web or some emulators)
  }
};

export default function TaskInputForm({ onFormSubmit, onCancel }) {
  const theme = useAuthTheme();

  // 1. Core State
  const [step, setStep] = useState(1);
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [studyHours, setStudyHours] = useState({
    Monday: 2,
    Tuesday: 2,
    Wednesday: 2,
    Thursday: 2,
    Friday: 2,
    Saturday: 4,
    Sunday: 4,
  });
  const [priorities, setPriorities] = useState({});

  // 2. Step Specific Inputs / Temporaries
  const [subjectInput, setSubjectInput] = useState('');
  
  // Step 2 (Exams) Form State
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [showExamSubjectDropdown, setShowExamSubjectDropdown] = useState(false);

  // Step 3 (Assignments) Form State
  const [assignmentSubject, setAssignmentSubject] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [showAssignmentSubjectDropdown, setShowAssignmentSubjectDropdown] = useState(false);

  // Calendar State & Modal Visibility
  const [calendarTarget, setCalendarTarget] = useState(null); // 'exam' or 'assignment'
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Success screen state
  const [copied, setCopied] = useState(false);

  // 3. Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Run transition animation when step changes
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, fadeAnim, slideAnim]);

  // Sync priorities when subjects list changes
  useEffect(() => {
    setPriorities((prevPriorities) => {
      const newPriorities = { ...prevPriorities };
      let changed = false;
      
      // Add default priority (3/5) for new subjects
      subjects.forEach((subj) => {
        if (newPriorities[subj] === undefined) {
          newPriorities[subj] = 3;
          changed = true;
        }
      });

      // Remove deleted subjects
      Object.keys(newPriorities).forEach((subj) => {
        if (!subjects.includes(subj)) {
          delete newPriorities[subj];
          changed = true;
        }
      });

      return changed ? newPriorities : prevPriorities;
    });
  }, [subjects]);

  // Set default subject values for dropdowns when subjects list is populated
  useEffect(() => {
    if (subjects.length > 0) {
      if (!examSubject || !subjects.includes(examSubject)) {
        setExamSubject(subjects[0]);
      }
      if (!assignmentSubject || !subjects.includes(assignmentSubject)) {
        setAssignmentSubject(subjects[0]);
      }
    }
  }, [subjects, examSubject, assignmentSubject]);

  // 4. Input Helpers and Actions
  const handleAddSubject = () => {
    const cleanSubj = subjectInput.trim();
    if (!cleanSubj) {
      setErrors({ ...errors, subject: 'Subject name cannot be empty.' });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (subjects.some((s) => s.toLowerCase() === cleanSubj.toLowerCase())) {
      setErrors({ ...errors, subject: 'Subject already exists in list.' });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    triggerHaptic();
    setSubjects([...subjects, cleanSubj]);
    setSubjectInput('');
    setErrors({ ...errors, subject: null });
  };

  const handleRemoveSubject = (indexToRemove) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const subjectToRemove = subjects[indexToRemove];
    setSubjects(subjects.filter((_, idx) => idx !== indexToRemove));
    
    // Clean up corresponding exams and assignments
    setExams(exams.filter((exam) => exam.subject !== subjectToRemove));
    setAssignments(assignments.filter((assign) => assign.subject !== subjectToRemove));
  };

  const handleAddExam = () => {
    if (!examSubject) {
      setErrors({ ...errors, exam: 'Please select a subject.' });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (!examDate) {
      setErrors({ ...errors, exam: 'Please select a date for the exam.' });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    triggerHaptic();
    const newExam = {
      id: Date.now().toString(),
      subject: examSubject,
      date: examDate,
    };
    setExams([...exams, newExam]);
    setExamDate('');
    setErrors({ ...errors, exam: null });
  };

  const handleRemoveExam = (id) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setExams(exams.filter((exam) => exam.id !== id));
  };

  const handleAddAssignment = () => {
    if (!assignmentSubject) {
      setErrors({ ...errors, assignment: 'Please select a subject.' });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    const cleanTitle = assignmentTitle.trim();
    if (!cleanTitle) {
      setErrors({ ...errors, assignment: 'Please enter an assignment title.' });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }
    if (!assignmentDueDate) {
      setErrors({ ...errors, assignment: 'Please select a due date.' });
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    triggerHaptic();
    const newAssignment = {
      id: Date.now().toString(),
      subject: assignmentSubject,
      title: cleanTitle,
      dueDate: assignmentDueDate,
    };
    setAssignments([...assignments, newAssignment]);
    setAssignmentTitle('');
    setAssignmentDueDate('');
    setErrors({ ...errors, assignment: null });
  };

  const handleRemoveAssignment = (id) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setAssignments(assignments.filter((assign) => assign.id !== id));
  };

  const adjustHours = (day, offset) => {
    triggerHaptic();
    setStudyHours((prev) => {
      const current = prev[day];
      const newVal = Math.max(0, Math.min(24, current + offset));
      return { ...prev, [day]: newVal };
    });
  };

  const handleRateSubject = (subj, rating) => {
    triggerHaptic();
    setPriorities({ ...priorities, [subj]: rating });
  };

  // 5. Navigation & Global Validation
  const validateStep = () => {
    if (step === 1) {
      if (subjects.length === 0) {
        setErrors({ ...errors, step1: 'Please add at least one subject to proceed.' });
        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        return false;
      }
      setErrors({ ...errors, step1: null });
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    triggerHaptic();
    setStep(step + 1);
  };

  const handleBack = () => {
    triggerHaptic();
    setStep(Math.max(1, step - 1));
  };

  const handleSubmit = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Success);
    
    const finalPayload = {
      subjects,
      exams: exams.map(e => ({ subject: e.subject, date: e.date })),
      assignments: assignments.map(a => ({ subject: a.subject, title: a.title, dueDate: a.dueDate })),
      studyHours,
      priorities,
    };

    setStep(6); // Go to JSON viewer step

    if (onFormSubmit) {
      onFormSubmit(finalPayload);
    }
  };

  const handleReset = () => {
    triggerHaptic();
    setStep(1);
    setSubjects([]);
    setExams([]);
    setAssignments([]);
    setStudyHours({
      Monday: 2,
      Tuesday: 2,
      Wednesday: 2,
      Thursday: 2,
      Friday: 2,
      Saturday: 4,
      Sunday: 4,
    });
    setPriorities({});
    setErrors({});
    setSubjectInput('');
    setExamDate('');
    setAssignmentTitle('');
    setAssignmentDueDate('');
    setCopied(false);
  };

  // 6. Custom Calendar Picker Logic
  const openCalendar = (target) => {
    triggerHaptic();
    setCalendarTarget(target);
    setCalendarMonth(new Date());
    setCalendarVisible(true);
  };

  const handleSelectDate = (dateString) => {
    triggerHaptic();
    if (calendarTarget === 'exam') {
      setExamDate(dateString);
    } else if (calendarTarget === 'assignment') {
      setAssignmentDueDate(dateString);
    }
    setCalendarVisible(false);
    setCalendarTarget(null);
  };

  const changeMonth = (offset) => {
    triggerHaptic();
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1));
  };

  const renderCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayCells = [];

    // Weekday headers
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const headers = weekDays.map((d, i) => (
      <View key={`header-${i}`} style={styles.calendarDayHeader}>
        <Text style={[styles.calendarDayHeaderText, { color: theme.textMuted }]}>{d}</Text>
      </View>
    ));

    // Empty spots for calendar offset
    for (let i = 0; i < firstDayIndex; i++) {
      dayCells.push(<View key={`empty-${i}`} style={styles.calendarDayCellEmpty} />);
    }

    // Days list
    for (let d = 1; d <= totalDays; d++) {
      const currentDate = new Date(year, month, d);
      const isPast = currentDate < today;
      const formattedDateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const isSelected = calendarTarget === 'exam' 
        ? examDate === formattedDateString 
        : assignmentDueDate === formattedDateString;

      dayCells.push(
        <Pressable
          key={`day-${d}`}
          disabled={isPast}
          onPress={() => handleSelectDate(formattedDateString)}
          style={({ pressed }) => [
            styles.calendarDayCell,
            isPast && styles.calendarDayCellDisabled,
            isSelected && { backgroundColor: theme.primary },
            pressed && !isPast && { opacity: 0.7 },
          ]}
        >
          <Text
            style={[
              styles.calendarDayCellText,
              { color: isSelected ? theme.buttonText : isPast ? theme.textMuted : theme.text },
              isSelected && { fontWeight: '700' },
            ]}
          >
            {d}
          </Text>
        </Pressable>
      );
    }

    return (
      <View style={styles.calendarGrid}>
        {headers}
        {dayCells}
      </View>
    );
  };

  // 7. Clipboard and Sharing Utilities
  const getPayloadJSON = () => {
    const finalPayload = {
      subjects,
      exams: exams.map(e => ({ subject: e.subject, date: e.date })),
      assignments: assignments.map(a => ({ subject: a.subject, title: a.title, dueDate: a.dueDate })),
      studyHours,
      priorities,
    };
    return JSON.stringify(finalPayload, null, 2);
  };

  const handleCopyToClipboard = () => {
    triggerHaptic();
    const jsonStr = getPayloadJSON();
    try {
      Clipboard.setString(jsonStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_e) {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(jsonStr);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleSharePayload = async () => {
    triggerHaptic();
    const jsonStr = getPayloadJSON();
    try {
      await Share.share({
        message: jsonStr,
        title: 'Study Planner Tasks Payload',
      });
    } catch (error) {
      console.log('Error sharing: ', error.message);
    }
  };

  // 8. Progress Indicator Bar
  const renderProgressIndicator = () => {
    if (step > 5) return null;
    const progressPercent = ((step - 1) / 4) * 100;
    
    return (
      <View style={styles.progressContainer}>
        {/* Progress Background Line */}
        <View style={[styles.progressBgLine, { backgroundColor: theme.border }]} />
        {/* Active Progress Line */}
        <View style={[styles.progressActiveLine, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
        
        {/* Step circles */}
        {[1, 2, 3, 4, 5].map((i) => {
          const isActive = step === i;
          const isCompleted = step > i;

          return (
            <View key={i} style={styles.stepIndicatorWrapper}>
              <View
                style={[
                  styles.stepIndicatorDot,
                  {
                    backgroundColor: isActive 
                      ? theme.primary 
                      : isCompleted 
                        ? theme.primary 
                        : theme.inputBackground,
                    borderColor: isActive || isCompleted ? theme.primary : theme.border,
                  },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={theme.buttonText} />
                ) : (
                  <Text
                    style={[
                      styles.stepIndicatorText,
                      { color: isActive ? theme.buttonText : theme.textMuted },
                    ]}
                  >
                    {i}
                  </Text>
                )}
              </View>
              <Text 
                numberOfLines={1} 
                style={[
                  styles.stepLabelText, 
                  { color: isActive ? theme.text : theme.textMuted }
                ]}
              >
                {i === 1 && 'Subjects'}
                {i === 2 && 'Exams'}
                {i === 3 && 'Tasks'}
                {i === 4 && 'Hours'}
                {i === 5 && 'Rates'}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // 9. Step Screens Rendering
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Add Subjects</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              Enter the subjects you want to prepare study plans for. Add at least one to continue.
            </Text>

            {/* Input Row */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Subject Name</Text>
              <View style={styles.inputRow}>
                <TextInput
                  value={subjectInput}
                  onChangeText={setSubjectInput}
                  placeholder="e.g. Mathematics, Organic Chemistry"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.inputField,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: errors.subject ? theme.error : theme.border,
                      color: theme.text,
                    },
                  ]}
                />
                <Pressable
                  onPress={handleAddSubject}
                  style={[styles.addButton, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="add" size={24} color={theme.buttonText} />
                </Pressable>
              </View>
              {errors.subject ? (
                <Text style={[styles.errorText, { color: theme.error }]}>{errors.subject}</Text>
              ) : null}
            </View>

            {/* Subject Chips List */}
            <View style={styles.chipsContainer}>
              {subjects.map((subj, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.chip, 
                    { backgroundColor: theme.surfaceSoft, borderColor: theme.border }
                  ]}
                >
                  <Text style={[styles.chipText, { color: theme.text }]}>{subj}</Text>
                  <Pressable onPress={() => handleRemoveSubject(idx)} style={styles.chipRemove}>
                    <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                  </Pressable>
                </View>
              ))}
              {subjects.length === 0 && (
                <Text style={[styles.emptyListText, { color: theme.textMuted }]}>
                  No subjects added yet. Add one above!
                </Text>
              )}
            </View>

            {errors.step1 ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.error + '1A', borderColor: theme.error }]}>
                <Ionicons name="warning-outline" size={16} color={theme.error} />
                <Text style={[styles.errorBannerText, { color: theme.error }]}>{errors.step1}</Text>
              </View>
            ) : null}
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Schedule Exams</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              Enter dates for your upcoming subject exams to allocate study prep time correctly. (Optional)
            </Text>

            {/* Form to Add Exam */}
            <View style={[styles.formBlock, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
              <Text style={[styles.formBlockTitle, { color: theme.text }]}>Add Upcoming Exam</Text>

              {/* Subject dropdown */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Subject</Text>
                <Pressable
                  onPress={() => setShowExamSubjectDropdown(!showExamSubjectDropdown)}
                  style={[
                    styles.dropdownTrigger,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <Text style={{ color: examSubject ? theme.text : theme.textMuted }}>
                    {examSubject || 'Select a subject'}
                  </Text>
                  <Ionicons 
                    name={showExamSubjectDropdown ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={theme.textMuted} 
                  />
                </Pressable>

                {showExamSubjectDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: theme.inputBackground, borderColor: theme.border, zIndex: 999 }]}>
                    {subjects.map((subj, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          setExamSubject(subj);
                          setShowExamSubjectDropdown(false);
                        }}
                        style={[styles.dropdownOption, { borderBottomColor: theme.border }]}
                      >
                        <Text style={{ color: theme.text }}>{subj}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Date Input */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Exam Date</Text>
                <Pressable
                  onPress={() => openCalendar('exam')}
                  style={[
                    styles.dateTrigger,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                  <Text style={[styles.dateTriggerText, { color: examDate ? theme.text : theme.textMuted }]}>
                    {examDate || 'YYYY-MM-DD'}
                  </Text>
                </Pressable>
              </View>

              {errors.exam ? (
                <Text style={[styles.errorText, { color: theme.error, marginBottom: Spacing.sm }]}>{errors.exam}</Text>
              ) : null}

              <Pressable
                onPress={handleAddExam}
                style={({ pressed }) => [
                  styles.formAddButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Ionicons name="calendar" size={16} color={theme.buttonText} />
                <Text style={[styles.formAddButtonText, { color: theme.buttonText }]}>Add Exam to Schedule</Text>
              </Pressable>
            </View>

            {/* List of Scheduled Exams */}
            <Text style={[styles.subSectionTitle, { color: theme.text }]}>Exam Schedule ({exams.length})</Text>
            <ScrollView style={styles.listScroll} nestedScrollEnabled>
              {exams.map((exam) => (
                <View 
                  key={exam.id} 
                  style={[
                    styles.listItem, 
                    { backgroundColor: theme.inputBackground, borderColor: theme.border }
                  ]}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>{exam.subject}</Text>
                    <View style={styles.listItemSub}>
                      <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                      <Text style={[styles.listItemSubText, { color: theme.textMuted }]}>{exam.date}</Text>
                    </View>
                  </View>
                  <Pressable onPress={() => handleRemoveExam(exam.id)} style={styles.listItemDelete}>
                    <Ionicons name="trash-outline" size={18} color={theme.error} />
                  </Pressable>
                </View>
              ))}
              {exams.length === 0 && (
                <Text style={[styles.emptyListText, { color: theme.textMuted, textAlign: 'left' }]}>
                  No exams added yet. Add one if you have exams coming up.
                </Text>
              )}
            </ScrollView>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Assignments & Tasks</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              List your upcoming homework tasks, essays, or project assignments. (Optional)
            </Text>

            {/* Form to Add Assignment */}
            <View style={[styles.formBlock, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
              <Text style={[styles.formBlockTitle, { color: theme.text }]}>Add New Assignment</Text>

              {/* Subject dropdown */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Subject</Text>
                <Pressable
                  onPress={() => setShowAssignmentSubjectDropdown(!showAssignmentSubjectDropdown)}
                  style={[
                    styles.dropdownTrigger,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <Text style={{ color: assignmentSubject ? theme.text : theme.textMuted }}>
                    {assignmentSubject || 'Select a subject'}
                  </Text>
                  <Ionicons 
                    name={showAssignmentSubjectDropdown ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={theme.textMuted} 
                  />
                </Pressable>

                {showAssignmentSubjectDropdown && (
                  <View style={[styles.dropdownMenu, { backgroundColor: theme.inputBackground, borderColor: theme.border, zIndex: 999 }]}>
                    {subjects.map((subj, idx) => (
                      <Pressable
                        key={idx}
                        onPress={() => {
                          setAssignmentSubject(subj);
                          setShowAssignmentSubjectDropdown(false);
                        }}
                        style={[styles.dropdownOption, { borderBottomColor: theme.border }]}
                      >
                        <Text style={{ color: theme.text }}>{subj}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              {/* Assignment Title */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Assignment Title</Text>
                <TextInput
                  value={assignmentTitle}
                  onChangeText={setAssignmentTitle}
                  placeholder="e.g. Chapter 4 Exercises, Research Draft"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.inputField,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                  ]}
                />
              </View>

              {/* Due Date */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>Due Date</Text>
                <Pressable
                  onPress={() => openCalendar('assignment')}
                  style={[
                    styles.dateTrigger,
                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                  ]}
                >
                  <Ionicons name="calendar-outline" size={18} color={theme.primary} />
                  <Text style={[styles.dateTriggerText, { color: assignmentDueDate ? theme.text : theme.textMuted }]}>
                    {assignmentDueDate || 'YYYY-MM-DD'}
                  </Text>
                </Pressable>
              </View>

              {errors.assignment ? (
                <Text style={[styles.errorText, { color: theme.error, marginBottom: Spacing.sm }]}>
                  {errors.assignment}
                </Text>
              ) : null}

              <Pressable
                onPress={handleAddAssignment}
                style={({ pressed }) => [
                  styles.formAddButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <Ionicons name="document-text" size={16} color={theme.buttonText} />
                <Text style={[styles.formAddButtonText, { color: theme.buttonText }]}>Add Assignment</Text>
              </Pressable>
            </View>

            {/* List of Assignments */}
            <Text style={[styles.subSectionTitle, { color: theme.text }]}>Pending Assignments ({assignments.length})</Text>
            <ScrollView style={styles.listScroll} nestedScrollEnabled>
              {assignments.map((assign) => (
                <View 
                  key={assign.id} 
                  style={[
                    styles.listItem, 
                    { backgroundColor: theme.inputBackground, borderColor: theme.border }
                  ]}
                >
                  <View style={styles.listItemContent}>
                    <Text style={[styles.listItemTitle, { color: theme.text }]}>{assign.title}</Text>
                    <View style={styles.listItemLabelRow}>
                      <View style={[styles.badge, { backgroundColor: theme.surfaceSoft }]}>
                        <Text style={[styles.badgeText, { color: theme.secondary }]}>{assign.subject}</Text>
                      </View>
                      <View style={styles.listItemSub}>
                        <Ionicons name="calendar-clear-outline" size={12} color={theme.textMuted} />
                        <Text style={[styles.listItemSubText, { color: theme.textMuted }]}>Due: {assign.dueDate}</Text>
                      </View>
                    </View>
                  </View>
                  <Pressable onPress={() => handleRemoveAssignment(assign.id)} style={styles.listItemDelete}>
                    <Ionicons name="trash-outline" size={18} color={theme.error} />
                  </Pressable>
                </View>
              ))}
              {assignments.length === 0 && (
                <Text style={[styles.emptyListText, { color: theme.textMuted, textAlign: 'left' }]}>
                  No assignments added yet. Add tasks if you have work to submit.
                </Text>
              )}
            </ScrollView>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Available Study Hours</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              Specify how many hours you can realistically study each day of the week.
            </Text>

            <ScrollView style={styles.hoursScroll} nestedScrollEnabled>
              {Object.keys(studyHours).map((day) => (
                <View 
                  key={day} 
                  style={[
                    styles.hoursCard, 
                    { backgroundColor: theme.inputBackground, borderColor: theme.border }
                  ]}
                >
                  <View style={styles.hoursDayInfo}>
                    <Text style={[styles.hoursDayName, { color: theme.text }]}>{day}</Text>
                    <Text style={[styles.hoursSubtitle, { color: theme.textMuted }]}>
                      {studyHours[day] === 0 ? 'Rest Day' : `${studyHours[day]} hour${studyHours[day] > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                  <View style={styles.hoursControls}>
                    <Pressable
                      onPress={() => adjustHours(day, -0.5)}
                      style={({ pressed }) => [
                        styles.counterButton,
                        { borderColor: theme.border, backgroundColor: theme.surfaceSoft },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons name="remove" size={16} color={theme.text} />
                    </Pressable>
                    <View style={styles.counterValueContainer}>
                      <Text style={[styles.counterValue, { color: theme.text }]}>{studyHours[day]}</Text>
                    </View>
                    <Pressable
                      onPress={() => adjustHours(day, 0.5)}
                      style={({ pressed }) => [
                        styles.counterButton,
                        { borderColor: theme.border, backgroundColor: theme.surfaceSoft },
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Ionicons name="add" size={16} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: theme.text }]}>Subject Priorities</Text>
            <Text style={[styles.stepDesc, { color: theme.textMuted }]}>
              Rate the importance or difficulty level of each subject from 1 to 5 to prioritize your study plan.
            </Text>

            <ScrollView style={styles.prioritiesScroll} nestedScrollEnabled>
              {subjects.map((subj) => {
                const currentRating = priorities[subj] || 3;
                return (
                  <View 
                    key={subj} 
                    style={[
                      styles.priorityCard, 
                      { backgroundColor: theme.inputBackground, borderColor: theme.border }
                    ]}
                  >
                    <View style={styles.priorityHeader}>
                      <Text style={[styles.prioritySubjectName, { color: theme.text }]}>{subj}</Text>
                      <Text style={[styles.priorityLabelText, { color: theme.primary, fontWeight: '700' }]}>
                        {currentRating === 1 && 'Low'}
                        {currentRating === 2 && 'Medium-Low'}
                        {currentRating === 3 && 'Medium'}
                        {currentRating === 4 && 'Medium-High'}
                        {currentRating === 5 && 'High'}
                      </Text>
                    </View>

                    {/* Star Rating Controller */}
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Pressable 
                          key={star} 
                          onPress={() => handleRateSubject(subj, star)}
                          style={({ pressed }) => [
                            styles.starButton,
                            pressed && { transform: [{ scale: 1.15 }] }
                          ]}
                        >
                          <Ionicons
                            name={star <= currentRating ? 'star' : 'star-outline'}
                            size={32}
                            color={star <= currentRating ? '#FFB03A' : theme.textMuted}
                          />
                        </Pressable>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        );

      case 6: // Final Summary / JSON Output Screen
        const jsonPayload = getPayloadJSON();
        return (
          <View style={[styles.stepContainer, { alignItems: 'center' }]}>
            <View style={[styles.successIconWrapper, { backgroundColor: theme.primary + '1F' }]}>
              <Ionicons name="checkmark-circle" size={64} color={theme.primary} />
            </View>
            
            <Text style={[styles.stepTitle, { color: theme.text, marginTop: Spacing.md, textAlign: 'center' }]}>
              Plan Details Captured!
            </Text>
            
            <Text style={[styles.stepDesc, { color: theme.textMuted, textAlign: 'center', marginBottom: Spacing.lg }]}>
              Your workload information is organized. Below is the structured JSON data ready to feed into the study planner algorithm.
            </Text>

            {/* JSON Code Viewer block */}
            <View style={[styles.jsonViewerBlock, { backgroundColor: theme.surfaceSoft, borderColor: theme.border }]}>
              <View style={styles.jsonViewerHeader}>
                <Text style={[styles.jsonViewerTitle, { color: theme.textMuted }]}>GENERATED PAYLOAD</Text>
                
                <View style={styles.jsonHeaderControls}>
                  <Pressable 
                    onPress={handleCopyToClipboard} 
                    style={[styles.jsonHeaderButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  >
                    <Ionicons name={copied ? "checkmark" : "copy-outline"} size={14} color={theme.text} />
                    <Text style={[styles.jsonHeaderBtnText, { color: theme.text }]}>
                      {copied ? "Copied" : "Copy"}
                    </Text>
                  </Pressable>
                  
                  <Pressable 
                    onPress={handleSharePayload} 
                    style={[styles.jsonHeaderButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                  >
                    <Ionicons name="share-social-outline" size={14} color={theme.text} />
                    <Text style={[styles.jsonHeaderBtnText, { color: theme.text }]}>Share</Text>
                  </Pressable>
                </View>
              </View>
              
              <ScrollView style={styles.jsonCodeScroll} contentContainerStyle={styles.jsonCodeContainer}>
                <Text style={[styles.jsonCodeText, { color: theme.text, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', web: 'monospace' }) }]}>
                  {jsonPayload}
                </Text>
              </ScrollView>
            </View>

            {/* Form actions on success */}
            <View style={styles.successActions}>
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [
                  styles.resetButton,
                  { borderColor: theme.border, backgroundColor: theme.inputBackground },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Ionicons name="refresh" size={18} color={theme.text} />
                <Text style={[styles.resetButtonText, { color: theme.text }]}>Create Another Plan</Text>
              </Pressable>
              
              {onCancel && (
                <Pressable
                  onPress={onCancel}
                  style={({ pressed }) => [
                    styles.doneButton,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Text style={[styles.doneButtonText, { color: theme.buttonText }]}>Go to Dashboard</Text>
                </Pressable>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Step Progress indicators */}
      {renderProgressIndicator()}

      {/* Main Animated Steps Panel */}
      <Animated.View
        style={[
          styles.animatedCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderStepContent()}
      </Animated.View>

      {/* Persistent Back & Next Bottom Buttons */}
      {step <= 5 && (
        <View style={styles.bottomNavigationRow}>
          {step > 1 ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.navButton,
                styles.navButtonSecondary,
                { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Ionicons name="arrow-back" size={18} color={theme.text} />
              <Text style={[styles.navButtonText, { color: theme.text }]}>Back</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.navButton,
                styles.navButtonSecondary,
                { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.navButtonText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
          )}

          {step < 5 ? (
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.navButton,
                styles.navButtonPrimary,
                { backgroundColor: theme.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={[styles.navButtonText, { color: theme.buttonText }]}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color={theme.buttonText} />
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.navButton,
                styles.navButtonSubmit,
                { backgroundColor: theme.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Ionicons name="sparkles" size={18} color={theme.buttonText} />
              <Text style={[styles.navButtonText, { color: theme.buttonText }]}>Generate Plan</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Gorgeous Custom Calendar Modal */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header */}
            <View style={styles.calendarModalHeader}>
              <Pressable onPress={() => changeMonth(-1)} style={styles.calendarHeaderArrow}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </Pressable>
              <Text style={[styles.calendarModalTitle, { color: theme.text }]}>
                {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
              <Pressable onPress={() => changeMonth(1)} style={styles.calendarHeaderArrow}>
                <Ionicons name="chevron-forward" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Grid */}
            {renderCalendarDays()}

            {/* Modal Actions */}
            <Pressable
              onPress={() => setCalendarVisible(false)}
              style={({ pressed }) => [
                styles.calendarCloseBtn,
                { backgroundColor: theme.surfaceSoft, borderColor: theme.border },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.calendarCloseBtnText, { color: theme.text }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: Spacing.md,
  },
  
  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    height: 60,
    position: 'relative',
    width: '100%',
  },
  progressBgLine: {
    position: 'absolute',
    height: 3,
    left: Spacing.lg,
    right: Spacing.lg,
    top: 25,
    zIndex: 1,
  },
  progressActiveLine: {
    position: 'absolute',
    height: 3,
    left: Spacing.lg,
    top: 25,
    zIndex: 2,
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
    zIndex: 3,
    width: 60,
  },
  stepIndicatorDot: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepIndicatorText: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  stepLabelText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Main Card
  animatedCard: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.md + 4,
    minHeight: 400,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },

  // Step Commons
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.title,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  stepDesc: {
    fontSize: Typography.body - 2,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  // Step 1: Subjects
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.label,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  inputField: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.body - 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.caption,
    marginTop: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  errorBannerText: {
    fontSize: Typography.caption + 1,
    fontWeight: '600',
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
    minHeight: 80,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: Typography.body - 2,
    fontWeight: '600',
  },
  chipRemove: {
    marginLeft: 6,
  },
  emptyListText: {
    fontSize: Typography.body - 2,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.md,
    width: '100%',
  },

  // Steps 2 & 3: Forms & Lists
  formBlock: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  formBlockTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
    marginBottom: -2,
  },
  formGroup: {
    gap: Spacing.xs,
  },
  dropdownTrigger: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  dropdownMenu: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    marginTop: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 0.5,
  },
  dateTrigger: {
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  dateTriggerText: {
    fontSize: Typography.body - 1,
  },
  formAddButton: {
    height: 44,
    borderRadius: Radius.sm,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  formAddButtonText: {
    fontSize: Typography.button - 1,
    fontWeight: '700',
  },
  subSectionTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  listScroll: {
    maxHeight: 180,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderRadius: Radius.sm,
    marginBottom: Spacing.xs,
  },
  listItemContent: {
    flex: 1,
    gap: 4,
  },
  listItemTitle: {
    fontSize: Typography.body - 1,
    fontWeight: '700',
  },
  listItemSub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  listItemSubText: {
    fontSize: Typography.caption,
    fontWeight: '500',
  },
  listItemDelete: {
    padding: Spacing.xs,
  },
  listItemLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Step 4: Available study hours
  hoursScroll: {
    maxHeight: 320,
  },
  hoursCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing.xs,
  },
  hoursDayInfo: {
    gap: 2,
  },
  hoursDayName: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
  },
  hoursSubtitle: {
    fontSize: Typography.caption + 1,
    fontWeight: '500',
  },
  hoursControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterValueContainer: {
    minWidth: 32,
    alignItems: 'center',
  },
  counterValue: {
    fontSize: Typography.body,
    fontWeight: '700',
  },

  // Step 5: Priorities
  prioritiesScroll: {
    maxHeight: 320,
  },
  priorityCard: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prioritySubjectName: {
    fontSize: Typography.body - 1,
    fontWeight: '800',
  },
  priorityLabelText: {
    fontSize: Typography.caption + 1,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  starButton: {
    padding: 2,
  },

  // Bottom Navigation Buttons
  bottomNavigationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  navButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderRadius: Radius.pill,
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
  },
  navButtonSecondary: {
    flex: 1,
    borderWidth: 1,
  },
  navButtonPrimary: {
    flex: 1.5,
  },
  navButtonSubmit: {
    flex: 2,
  },
  navButtonText: {
    fontSize: Typography.button,
    fontWeight: '700',
  },

  // Custom Calendar Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  calendarModalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    padding: Spacing.md,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  calendarModalTitle: {
    fontSize: Typography.body,
    fontWeight: '800',
  },
  calendarHeaderArrow: {
    padding: Spacing.xs,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginBottom: Spacing.md,
  },
  calendarDayHeader: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  calendarDayHeaderText: {
    fontSize: Typography.caption,
    fontWeight: '700',
  },
  calendarDayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  calendarDayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 1,
  },
  calendarDayCellDisabled: {
    opacity: 0.25,
  },
  calendarDayCellText: {
    fontSize: Typography.label,
    fontWeight: '500',
  },
  calendarCloseBtn: {
    height: 46,
    borderRadius: Radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCloseBtnText: {
    fontSize: Typography.button - 1,
    fontWeight: '700',
  },

  // Step 6: Review / JSON Success Screen
  successIconWrapper: {
    width: 90,
    height: 90,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jsonViewerBlock: {
    width: '100%',
    borderRadius: Radius.sm,
    borderWidth: 1,
    maxHeight: 280,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  jsonViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  jsonViewerTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  jsonHeaderControls: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  jsonHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  jsonHeaderBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  jsonCodeScroll: {
    flex: 1,
  },
  jsonCodeContainer: {
    padding: Spacing.md,
  },
  jsonCodeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  successActions: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resetButtonText: {
    fontSize: Typography.button - 1,
    fontWeight: '700',
  },
  doneButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: Typography.button - 1,
    fontWeight: '700',
  },
});
