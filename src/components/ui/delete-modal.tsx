"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, AlertTriangle, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/lib/types';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onDeleteAll: () => Promise<void>;
  onDeleteSelected: (sessionIds: string[]) => Promise<void>;
  activeSessionId: string | null;
}

export function DeleteModal({
  isOpen,
  onClose,
  sessions,
  onDeleteAll,
  onDeleteSelected,
  activeSessionId
}: DeleteModalProps) {
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'select' | 'all' | null>(null);

  const handleSelectSession = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  const handleSelectAll = () => {
    const selectableSessions = sessions.filter(s => s.id !== activeSessionId);
    const allIds = new Set(selectableSessions.map(s => s.id));
    setSelectedSessions(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedSessions(new Set());
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAll();
      onClose();
    } catch (error) {
      console.error('Error deleting all sessions:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSessions.size === 0) return;
    
    setIsDeleting(true);
    try {
      await onDeleteSelected(Array.from(selectedSessions));
      onClose();
    } catch (error) {
      console.error('Error deleting selected sessions:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setSelectedSessions(new Set());
    setDeleteMode(null);
    onClose();
  };

  const selectableSessions = sessions.filter(s => s.id !== activeSessionId);
  const allSelected = selectableSessions.length > 0 && 
    selectableSessions.every(s => selectedSessions.has(s.id));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 size={20} />
            Delete Conversations
          </DialogTitle>
          <DialogDescription>
            Choose how you want to delete your chat history
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!deleteMode ? (
            // Initial selection screen
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4 border-destructive/20 hover:border-destructive/40 hover:bg-destructive/5"
                onClick={() => setDeleteMode('all')}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-destructive mt-0.5" />
                  <div className="text-left">
                    <div className="font-medium">Delete All Conversations</div>
                    <div className="text-sm text-muted-foreground">
                      Permanently remove all chat history
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => setDeleteMode('select')}
                disabled={selectableSessions.length === 0}
              >
                <div className="flex items-start gap-3">
                  <Check size={20} className="text-primary mt-0.5" />
                  <div className="text-left">
                    <div className="font-medium">Select Specific Conversations</div>
                    <div className="text-sm text-muted-foreground">
                      Choose which conversations to delete
                    </div>
                  </div>
                </div>
              </Button>
            </div>
          ) : deleteMode === 'all' ? (
            // Delete all confirmation
            <div className="space-y-4">
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-destructive mt-0.5" />
                  <div>
                    <div className="font-medium text-destructive">Warning</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      This will permanently delete all {sessions.length} conversations. 
                      This action cannot be undone.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteMode(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAll}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete All'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            // Select specific conversations
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">
                  Select conversations to delete
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeselectAll}
                    className="text-xs"
                  >
                    Deselect All
                  </Button>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                {selectableSessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No conversations available to delete
                  </div>
                ) : (
                  selectableSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md transition-colors",
                        selectedSessions.has(session.id)
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedSessions.has(session.id)}
                        onCheckedChange={() => handleSelectSession(session.id)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {session.topic || 'New Chat'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteMode(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={selectedSessions.size === 0 || isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Deleting...
                    </>
                  ) : (
                    `Delete ${selectedSessions.size} Selected`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 