import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import TabNavigation from '@/components/common/TabNavigation';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BROADCASTS,
  INITIAL_MESSAGE_LOGS,
  INITIAL_TEMPLATES,
} from '@/data/communicationMock';
import type {
  AnnouncementItem,
  BroadcastScheduleItem,
  MessageLogItem,
  MessageTemplateItem,
} from '@/types/modules';

type CommTab = 'announcements' | 'broadcasts' | 'logs' | 'templates';

export default function CommunicationScreen() {
  const [activeTab, setActiveTab] = useState<CommTab>('announcements');
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<string>('All');

  // Local state for interactive communication
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);
  const [broadcasts, setBroadcasts] = useState<BroadcastScheduleItem[]>(INITIAL_BROADCASTS);
  const [messageLogs, setMessageLogs] = useState<MessageLogItem[]>(INITIAL_MESSAGE_LOGS);
  const [templates] = useState<MessageTemplateItem[]>(INITIAL_TEMPLATES);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formAudience, setFormAudience] = useState<AnnouncementItem['targetAudience']>('All');
  const [formPriority, setFormPriority] = useState<AnnouncementItem['priority']>('General');
  const [formChannel, setFormChannel] = useState<'SMS' | 'WhatsApp'>('SMS');

  const tabs = useMemo(
    () => [
      { id: 'announcements', label: 'Notice Board', badge: announcements.length },
      { id: 'broadcasts', label: 'Broadcasts', badge: broadcasts.filter((b) => b.status === 'Scheduled').length },
      { id: 'logs', label: 'SMS & WhatsApp Logs', badge: messageLogs.length },
      { id: 'templates', label: 'Templates', badge: templates.length },
    ],
    [announcements.length, broadcasts, messageLogs.length, templates.length]
  );

  // Filtered datasets
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((a) => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesAudience = audienceFilter === 'All' || a.targetAudience === audienceFilter;
      return matchesSearch && matchesAudience;
    });
  }, [announcements, searchQuery, audienceFilter]);

  const filteredBroadcasts = useMemo(() => {
    return broadcasts.filter(
      (b) =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.targetGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.channel.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [broadcasts, searchQuery]);

  const filteredLogs = useMemo(() => {
    return messageLogs.filter(
      (l) =>
        l.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.recipientPhone.includes(searchQuery) ||
        l.messageText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [messageLogs, searchQuery]);

  const filteredTemplates = useMemo(() => {
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.templateBody.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  // Handle Add/Send
  const handleCreateCommunication = () => {
    if (!formTitle.trim()) {
      Alert.alert('Required Field', 'Please enter a title or recipient.');
      return;
    }

    if (activeTab === 'announcements') {
      const newAnn: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        title: formTitle,
        content: formContent || 'No description provided.',
        targetAudience: formAudience,
        priority: formPriority,
        publishedDate: 'Today',
        author: 'School Administration',
      };
      setAnnouncements([newAnn, ...announcements]);
      Alert.alert('Success', `Announcement "${formTitle}" posted to Notice Board.`);
    } else if (activeTab === 'broadcasts') {
      const newBc: BroadcastScheduleItem = {
        id: `bc-${Date.now()}`,
        title: formTitle,
        channel: formChannel,
        scheduledTime: 'Tomorrow, 09:00 AM',
        targetGroup: formAudience === 'All' ? 'All Registered Contacts' : `${formAudience} Group`,
        status: 'Scheduled',
        recipientCount: 450,
      };
      setBroadcasts([newBc, ...broadcasts]);
      Alert.alert('Scheduled', `Broadcast "${formTitle}" queued via ${formChannel}.`);
    } else if (activeTab === 'logs') {
      const newLog: MessageLogItem = {
        id: `msg-${Date.now()}`,
        recipientName: formTitle,
        recipientPhone: '+1 555-0100',
        channel: formChannel,
        messageText: formContent || 'School operational notification sent successfully.',
        sentTime: 'Just now',
        status: 'Delivered',
      };
      setMessageLogs([newLog, ...messageLogs]);
      Alert.alert('Sent', `Message dispatched to ${formTitle}.`);
    }

    setFormTitle('');
    setFormContent('');
    setShowAddModal(false);
  };

  const getPriorityBadgeStyle = (priority: AnnouncementItem['priority']) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Academic':
        return 'bg-blue-50 text-[#3D5EE1] border-blue-200';
      case 'Event':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as CommTab);
          setSearchQuery('');
        }}
      />

      {/* Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900">
              Communication Hub
            </Text>
            <Text className="text-xs text-slate-500">
              Announcements, broadcast scheduler & instant SMS / WhatsApp
            </Text>
          </View>

          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={15} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">
              {activeTab === 'logs' ? 'Send' : 'Compose'}
            </Text>
          </Pressable>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />

        {/* Audience filter pills for Announcements */}
        {activeTab === 'announcements' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
            {['All', 'Parents', 'Students', 'Teachers'].map((aud) => (
              <Pressable
                key={aud}
                onPress={() => setAudienceFilter(aud)}
                className={`mr-2 rounded-xl px-3 py-1.5 ${
                  audienceFilter === aud
                    ? 'bg-[#3D5EE1]'
                    : 'bg-slate-100 border border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    audienceFilter === aud ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {aud}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Main Content List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-14"
      >
        {/* NOTICE BOARD & ANNOUNCEMENTS */}
        {activeTab === 'announcements' && (
          <View className="gap-y-3">
            {filteredAnnouncements.map((ann) => (
              <View
                key={ann.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1.5">
                      <View
                        className={`rounded-md px-2 py-0.5 border ${getPriorityBadgeStyle(
                          ann.priority
                        )}`}
                      >
                        <Text className="text-[10px] font-bold">{ann.priority}</Text>
                      </View>
                      <View className="rounded-md bg-slate-100 px-2 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">
                          To: {ann.targetAudience}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{ann.title}</Text>
                  </View>
                  <Text className="text-[11px] font-medium text-slate-400">
                    {ann.publishedDate}
                  </Text>
                </View>

                <Text className="mt-2 text-xs leading-relaxed text-slate-600">
                  {ann.content}
                </Text>

                {ann.attachmentName ? (
                  <View className="mt-3 flex-row items-center rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <Feather name="paperclip" size={14} color="#3D5EE1" />
                    <Text className="ml-2 flex-1 text-xs font-semibold text-slate-800" numberOfLines={1}>
                      {ann.attachmentName}
                    </Text>
                    <Pressable
                      onPress={() => Alert.alert('Attachment', `Downloading ${ann.attachmentName}`)}
                      className="rounded-lg bg-white px-2 py-1 border border-slate-200"
                    >
                      <Text className="text-[11px] font-bold text-[#3D5EE1]">Download</Text>
                    </Pressable>
                  </View>
                ) : null}

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <Feather name="user-check" size={12} color="#64748b" />
                    <Text className="ml-1 text-[11px] text-slate-500">By {ann.author}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Share Circular',
                        `Sharing "${ann.title}" via school portal and SMS circular.`
                      )
                    }
                    className="flex-row items-center"
                  >
                    <Feather name="share-2" size={13} color="#3D5EE1" />
                    <Text className="ml-1 text-xs font-semibold text-[#3D5EE1]">Circulate</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* BROADCAST SCHEDULER */}
        {activeTab === 'broadcasts' && (
          <View className="gap-y-3">
            {filteredBroadcasts.map((bc) => (
              <View
                key={bc.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                        <Text className="text-[10px] font-bold text-emerald-700">{bc.channel}</Text>
                      </View>
                      <StatusBadge status={bc.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{bc.title}</Text>
                    <Text className="text-xs text-slate-500">Target: {bc.targetGroup}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <Feather name="clock" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-700">{bc.scheduledTime}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="users" size={13} color="#3D5EE1" />
                    <Text className="ml-1.5 text-xs font-bold text-[#3D5EE1]">
                      {bc.recipientCount} Recipients
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* MESSAGE LOGS (SMS / WHATSAPP) */}
        {activeTab === 'logs' && (
          <View className="gap-y-3">
            {filteredLogs.map((log) => (
              <View
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-lg ${
                        log.channel === 'WhatsApp' ? 'bg-emerald-100' : 'bg-blue-100'
                      }`}
                    >
                      <Feather
                        name={log.channel === 'WhatsApp' ? 'message-circle' : 'smartphone'}
                        size={16}
                        color={log.channel === 'WhatsApp' ? '#059669' : '#3D5EE1'}
                      />
                    </View>
                    <View className="ml-2.5">
                      <Text className="text-sm font-bold text-slate-900">{log.recipientName}</Text>
                      <Text className="text-[11px] text-slate-500">{log.recipientPhone}</Text>
                    </View>
                  </View>
                  <StatusBadge status={log.status} />
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-3">
                  <Text className="text-xs text-slate-700 leading-relaxed italic">
                    &ldquo;{log.messageText}&rdquo;
                  </Text>
                </View>

                <View className="mt-2.5 flex-row items-center justify-between">
                  <Text className="text-[11px] text-slate-400">{log.sentTime}</Text>
                  <Text className="text-[11px] font-semibold text-slate-600">via {log.channel} Gateway</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* MESSAGE TEMPLATES */}
        {activeTab === 'templates' && (
          <View className="gap-y-3">
            {filteredTemplates.map((tpl) => (
              <View
                key={tpl.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-sm font-bold text-slate-900">{tpl.name}</Text>
                    <Text className="text-xs text-slate-500">{tpl.category} · {tpl.channel}</Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setFormContent(tpl.templateBody);
                      setFormTitle(tpl.name);
                      setShowAddModal(true);
                    }}
                    className="rounded-lg bg-blue-50 px-2.5 py-1.5 border border-blue-200"
                  >
                    <Text className="text-xs font-bold text-[#3D5EE1]">Use Template</Text>
                  </Pressable>
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-3 border border-dashed border-slate-300">
                  <Text className="text-xs text-slate-700 font-mono leading-relaxed">
                    {tpl.templateBody}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Compose Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">
                {activeTab === 'announcements'
                  ? 'New Announcement'
                  : activeTab === 'broadcasts'
                  ? 'Schedule Broadcast'
                  : 'Send Message'}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'logs' ? 'Recipient Name / Phone *' : 'Subject / Title *'}
                </Text>
                <TextInput
                  value={formTitle}
                  onChangeText={setFormTitle}
                  placeholder="e.g. Science Fair Registration / John Smith"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Message Content *</Text>
                <TextInput
                  value={formContent}
                  onChangeText={setFormContent}
                  placeholder="Type circular announcement or notification text…"
                  multiline
                  numberOfLines={4}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 text-top min-h-[90px]"
                />
              </View>

              <View className="flex-row gap-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Audience</Text>
                  <View className="flex-row gap-1">
                    {(['All', 'Parents', 'Students'] as const).map((aud) => (
                      <Pressable
                        key={aud}
                        onPress={() => setFormAudience(aud)}
                        className={`flex-1 items-center py-2 rounded-xl border ${
                          formAudience === aud
                            ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-bold ${
                            formAudience === aud ? 'text-white' : 'text-slate-700'
                          }`}
                        >
                          {aud}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">
                    {activeTab === 'announcements' ? 'Priority' : 'Channel'}
                  </Text>
                  <View className="flex-row gap-1">
                    {activeTab === 'announcements'
                      ? (['General', 'Urgent', 'Academic'] as const).map((p) => (
                          <Pressable
                            key={p}
                            onPress={() => setFormPriority(p)}
                            className={`flex-1 items-center py-2 rounded-xl border ${
                              formPriority === p
                                ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-bold ${
                                formPriority === p ? 'text-white' : 'text-slate-700'
                              }`}
                            >
                              {p}
                            </Text>
                          </Pressable>
                        ))
                      : (['SMS', 'WhatsApp'] as const).map((ch) => (
                          <Pressable
                            key={ch}
                            onPress={() => setFormChannel(ch)}
                            className={`flex-1 items-center py-2 rounded-xl border ${
                              formChannel === ch
                                ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <Text
                              className={`text-[11px] font-bold ${
                                formChannel === ch ? 'text-white' : 'text-slate-700'
                              }`}
                            >
                              {ch}
                            </Text>
                          </Pressable>
                        ))}
                  </View>
                </View>
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateCommunication}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Publish / Send</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
