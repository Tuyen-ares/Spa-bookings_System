import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as apiService from '../../services/apiService';
import type { ChatMessage, Service, TreatmentCourse } from '../../types';

type Props = NativeStackScreenProps<any, 'Chatbot'>;

export const ChatbotScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [treatmentCourses, setTreatmentCourses] = useState<TreatmentCourse[]>([]);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Load initial greeting
    setMessages([{
      sender: 'bot',
      text: 'Chào bạn! Tôi là Thơ, trợ lý ảo của Anh Thơ Spa. Tôi có thể giúp gì cho bạn?'
    }]);

    // Load services and treatment courses for chatbot context
    loadContextData();
  }, []);

  useEffect(() => {
    // Scroll to bottom when new message is added
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadContextData = async () => {
    try {
      const [servicesData, coursesData] = await Promise.all([
        apiService.getServices(),
        apiService.getTreatmentCourses(),
      ]);
      setServices(servicesData);
      setTreatmentCourses(coursesData);
    } catch (error) {
      console.error('Error loading context data:', error);
      // Continue without context data if it fails
    }
  };

  const handleSendMessage = async () => {
    if (userInput.trim() === '' || isLoading) return;

    const currentInput = userInput.trim();
    const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: currentInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsLoading(true);

    try {
      // Pass services and treatment courses to the chatbot
      const botResponse = await apiService.getChatbotResponse(newMessages, services, treatmentCourses);
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: 'Rất xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại hoặc liên hệ với chúng tôi qua hotline: 098-765-4321.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View
        key={index}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.botMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatar}>
            <Ionicons name="chatbubble-ellipses" size={20} color="#E91E63" />
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.botMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.botMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Trợ lý Anh Thơ Spa</Text>
          <Text style={styles.headerSubtitle}>Thơ - Trợ lý ảo</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.botMessageContainer}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="chatbubble-ellipses" size={20} color="#E91E63" />
                  </View>
                  <View style={styles.botMessageBubble}>
                    <ActivityIndicator size="small" color="#E91E63" />
                  </View>
                </View>
              </View>
            ) : null
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={handleSendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!userInput.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!userInput.trim() || isLoading}
          >
            <Ionicons
              name="send"
              size={20}
              color={!userInput.trim() || isLoading ? '#999' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E91E63',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userMessageBubble: {
    backgroundColor: '#E91E63',
    borderBottomRightRadius: 4,
  },
  botMessageBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  loadingContainer: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
});

