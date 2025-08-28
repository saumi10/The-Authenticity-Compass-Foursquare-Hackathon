import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import GeminiService from '../services/GeminiService.js';

export default function AIReviewModal({ visible, onClose, place }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInitialReview, setIsGeneratingInitialReview] = useState(false);
  const scrollViewRef = useRef();

  useEffect(() => {
    if (visible && place) {
      generateInitialReview();
    }
  }, [visible, place]);

  const generateInitialReview = async () => {
    setIsGeneratingInitialReview(true);
    setMessages([]);

    // Check if Gemini service is configured
    if (!GeminiService.isConfigured()) {
      setMessages([
        {
          id: 1,
          text: `AI Review feature requires setup. ${GeminiService.getSetupInstructions()}`,
          isUser: false,
          timestamp: new Date(),
        }
      ]);
      setIsGeneratingInitialReview(false);
      return;
    }

    try {
      const result = await GeminiService.generatePlaceReview(place);
      
      setMessages([
        {
          id: 1,
          text: result.text,
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } catch (error) {
      console.error('Error generating initial review:', error);
      setMessages([
        {
          id: 1,
          text: 'Sorry, I encountered an error while generating the review. You can still ask me questions about this place!',
          isUser: false,
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsGeneratingInitialReview(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await GeminiService.generateContextualResponse(
        place, 
        messages, 
        userMessage.text
      );
      
      const aiMessage = {
        id: messages.length + 2,
        text: result.text,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: 'Sorry, I encountered an error processing your question. Please try again.',
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    setInputText('');
    setIsLoading(false);
    setIsGeneratingInitialReview(false);
    onClose();
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!place) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <MaterialIcons name="star" size={24} color={colors.primary} />
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>AI Review</Text>
                  <Text style={styles.headerSubtitle}>{place.name}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
              {isGeneratingInitialReview && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Generating AI review...</Text>
                </View>
              )}

              {messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    styles.messageContainer,
                    message.isUser ? styles.userMessage : styles.aiMessage
                  ]}
                >
                  <View style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.aiBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      message.isUser ? styles.userText : styles.aiText
                    ]}>
                      {message.text}
                    </Text>
                    <Text style={[
                      styles.timestamp,
                      message.isUser ? styles.userTimestamp : styles.aiTimestamp
                    ]}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}

              {isLoading && (
                <View style={[styles.messageContainer, styles.aiMessage]}>
                  <View style={[styles.messageBubble, styles.aiBubble]}>
                    <View style={styles.typingIndicator}>
                      <View style={styles.typingDot} />
                      <View style={[styles.typingDot, styles.typingDotDelay1]} />
                      <View style={[styles.typingDot, styles.typingDotDelay2]} />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about this place..."
                multiline
                maxLength={500}
                editable={!isLoading && !isGeneratingInitialReview}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!inputText.trim() || isLoading || isGeneratingInitialReview) && styles.sendButtonDisabled
                ]}
                onPress={sendMessage}
                disabled={!inputText.trim() || isLoading || isGeneratingInitialReview}
              >
                <MaterialIcons 
                  name="send" 
                  size={20} 
                  color={(!inputText.trim() || isLoading || isGeneratingInitialReview) ? colors.textLight : 'white'} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    maxHeight: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 5,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingVertical: 15,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
  messageContainer: {
    marginBottom: 15,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: colors.text,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 5,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTimestamp: {
    color: colors.textLight,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginHorizontal: 2,
    opacity: 0.4,
  },
  typingDotDelay1: {
    animationDelay: '0.2s',
  },
  typingDotDelay2: {
    animationDelay: '0.4s',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: 'white',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  sendButtonDisabled: {
    backgroundColor: colors.background,
  },
});