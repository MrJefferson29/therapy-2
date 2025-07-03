import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width } = Dimensions.get('window');

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CURRENT_DATE = new Date();

// Organized by crop type for better management
const FARMING_SCHEDULE = {
  "Today": [
    {
      cropType: "Tomatoes",
      tasks: [
        { time: "06:00", action: "Water plants", icon: "water", status: "pending" },
        { time: "14:00", action: "Check for pests", icon: "search", status: "pending" }
      ],
      progress: 65,
      stage: "Flowering"
    },
    {
      cropType: "Lettuce",
      tasks: [
        { time: "07:00", action: "Harvest mature heads", icon: "basket", status: "completed" }
      ],
      progress: 90,
      stage: "Ready for Harvest"
    }
  ],
  "Tomorrow": [
    {
      cropType: "Bell Peppers",
      tasks: [
        { time: "06:30", action: "Apply fertilizer", icon: "leaf", status: "pending" },
        { time: "15:00", action: "Prune excess leaves", icon: "cut", status: "pending" }
      ],
      progress: 45,
      stage: "Growing"
    }
  ],
  "This Week": [
    {
      cropType: "Carrots",
      tasks: [
        { time: "Thursday 06:00", action: "Thin seedlings", icon: "git-branch", status: "pending" }
      ],
      progress: 30,
      stage: "Early Growth"
    },
    {
      cropType: "Spinach",
      tasks: [
        { time: "Friday 07:00", action: "Check soil moisture", icon: "water", status: "pending" },
        { time: "Saturday 06:00", action: "Apply organic pesticide", icon: "shield", status: "pending" }
      ],
      progress: 50,
      stage: "Mid Growth"
    }
  ]
};

export default function Calendar() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [expandedCrop, setExpandedCrop] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const renderProgressBar = (progress) => {
    const barColor = progress >= 80 ? theme.success : progress >= 50 ? theme.warning : theme.error;
    
    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: barColor }]} />
      </View>
    );
  };

  const renderCropCard = (crop, index) => {
    const isExpanded = expandedCrop === crop.cropType;
    
    return (
      <TouchableOpacity 
        key={index}
        style={[styles.cropCard, isExpanded && styles.expandedCard, { backgroundColor: theme.surface }]}
        onPress={() => setExpandedCrop(isExpanded ? null : crop.cropType)}
      >
        <View style={styles.cropHeader}>
          <View style={styles.cropInfo}>
            <ThemedText style={styles.cropType}>{crop.cropType}</ThemedText>
            <ThemedText style={styles.cropStage}>{crop.stage}</ThemedText>
          </View>
          <View style={styles.progressSection}>
            <ThemedText style={styles.progressText}>{crop.progress}%</ThemedText>
            {renderProgressBar(crop.progress)}
          </View>
        </View>

        {isExpanded && (
          <View style={[styles.tasksList, { borderTopColor: theme.border }]}>
            {crop.tasks.map((task, taskIndex) => (
              <View key={taskIndex} style={styles.taskItem}>
                <View style={styles.taskTimeContainer}>
                  <ThemedText style={styles.taskTime}>{task.time}</ThemedText>
                  <View style={[styles.timelineDot, 
                    { backgroundColor: task.status === 'completed' ? theme.success : theme.error }]} 
                  />
                  {taskIndex !== crop.tasks.length - 1 && <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />}
                </View>
                
                <View style={styles.taskContent}>
                  <View style={[styles.taskIconContainer, { backgroundColor: theme.surfaceVariant }]}>
                    <Ionicons name={task.icon} size={20} color={theme.primary} />
                  </View>
                  <View style={styles.taskDetails}>
                    <ThemedText style={styles.taskAction}>{task.action}</ThemedText>
                    <TouchableOpacity 
                      style={[styles.statusButton, 
                        { backgroundColor: task.status === 'completed' ? theme.success + '20' : theme.warning + '20' }]}
                    >
                      <ThemedText style={[styles.statusText, 
                        { color: task.status === 'completed' ? theme.success : theme.warning }]}>
                        {task.status === 'completed' ? 'Completed' : 'Mark Complete'}
                      </ThemedText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View>
          <ThemedText style={styles.monthText}>
            {MONTHS[CURRENT_DATE.getMonth()]} {CURRENT_DATE.getFullYear()}
          </ThemedText>
          <ThemedText style={styles.dateText}>
            {CURRENT_DATE.getDate()} {MONTHS[CURRENT_DATE.getMonth()]}
          </ThemedText>
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowCompleted(!showCompleted)}
        >
          <Ionicons name={showCompleted ? "checkmark-circle" : "checkmark-circle-outline"} 
            size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Time Period Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.periodSelector}
      >
        {Object.keys(FARMING_SCHEDULE).map((period) => (
          <TouchableOpacity
            key={period}
            style={[styles.periodButton, 
              selectedPeriod === period && { backgroundColor: theme.primary },
              { backgroundColor: theme.surfaceVariant }
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <ThemedText style={[styles.periodText, 
              selectedPeriod === period && { color: theme.onSurface }]}>
              {period}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Crops and Tasks */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {FARMING_SCHEDULE[selectedPeriod].map((crop, index) => renderCropCard(crop, index))}
      </ScrollView>

      {/* Add Task Button */}
      <TouchableOpacity style={styles.addButton}>
        <BlurView intensity={100} style={[styles.blurButton, { backgroundColor: theme.surfaceVariant + 'E6' }]}>
          <Ionicons name="add" size={24} color={theme.primary} />
          <ThemedText style={[styles.addButtonText, { color: theme.primary }]}>Add Task</ThemedText>
        </BlurView>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  monthText: {
    fontSize: 24,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 16,
    marginTop: 4,
  },
  filterButton: {
    padding: 8,
  },
  periodSelector: {
    paddingHorizontal: 12,
    marginVertical: 16,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  periodText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cropCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expandedCard: {
    backgroundColor: '#F8FAF9',
  },
  cropHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropInfo: {
    flex: 1,
  },
  cropType: {
    fontSize: 18,
    fontWeight: '600',
  },
  cropStage: {
    fontSize: 14,
    marginTop: 4,
  },
  progressSection: {
    alignItems: 'flex-end',
    width: 100,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  tasksList: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  taskItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  taskTimeContainer: {
    width: 80,
    alignItems: 'center',
  },
  taskTime: {
    fontSize: 14,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    position: 'absolute',
    top: 28,
    bottom: -8,
    left: 45,
  },
  taskContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskAction: {
    fontSize: 16,
    marginBottom: 4,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    overflow: 'hidden',
    borderRadius: 24,
  },
  blurButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});