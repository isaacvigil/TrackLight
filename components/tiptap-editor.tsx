"use client"

import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TiptapLink from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Bold, Italic, List, ListOrdered, ListTodo, Link as LinkIcon, Undo, Redo, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
}

export function TiptapEditor({ content, onChange, placeholder = "Start writing...", className }: TiptapEditorProps) {
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [hasSelection, setHasSelection] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable heading and code block extensions
        heading: false,
        codeBlock: false,
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary underline hover:opacity-80',
        },
        validate: (url) => {
          // Allow mailto: links and regular URLs
          return /^(https?:\/\/|mailto:)/.test(url) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url)
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'tiptap-prose max-w-none focus:outline-none h-full px-4 py-3',
        style: '-webkit-user-select: text; user-select: text; -webkit-touch-callout: default; touch-action: manipulation;',
        spellcheck: 'true',
        contenteditable: 'true',
      },
    },
    immediatelyRender: false,
    editable: true,
    enableInputRules: true,
    enablePasteRules: true,
  })

  const openLinkInput = useCallback(() => {
    if (!editor) return
    
    const { from, to } = editor.state.selection
    const hasTextSelected = from !== to
    
    setHasSelection(hasTextSelected)
    
    if (hasTextSelected) {
      // If text is selected, get the URL and the selected text
      const previousUrl = editor.getAttributes('link').href
      const selectedText = editor.state.doc.textBetween(from, to, '')
      setLinkUrl(previousUrl || '')
      setLinkText(selectedText)
    } else {
      // No text selected, prepare for new link with text
      setLinkUrl('')
      setLinkText('')
    }
    
    setShowLinkInput(true)
  }, [editor])

  const applyLink = useCallback(() => {
    if (!editor) return

    // empty URL - remove link if text was selected
    if (linkUrl === '') {
      if (hasSelection) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      }
      setShowLinkInput(false)
      return
    }

    const textToUse = linkText.trim() || linkUrl
    
    // Detect if the URL is an email address
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(linkUrl)
    const finalHref = isEmail && !linkUrl.startsWith('mailto:') 
      ? `mailto:${linkUrl}` 
      : linkUrl
    
    // Use target="_blank" for regular URLs, but not for mailto links
    const linkAttrs: { href: string; target?: string } = {
      href: finalHref,
    }
    
    if (!isEmail && !finalHref.startsWith('mailto:')) {
      linkAttrs.target = '_blank'
    }

    // Use the proper way to insert a link with text
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .deleteSelection()
      .insertContent({
        type: 'text',
        marks: [
          {
            type: 'link',
            attrs: linkAttrs,
          },
        ],
        text: textToUse,
      })
      .run()
    
    setShowLinkInput(false)
    setLinkUrl('')
    setLinkText('')
  }, [editor, linkUrl, linkText])

  const removeLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetLink().run()
    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("tiptap-editor-container border rounded-lg overflow-hidden flex flex-col flex-1", className)}>
      {/* Toolbar */}
      <div className="border-b bg-muted/50 px-2 py-1.5 flex items-center gap-1 flex-wrap flex-shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bold') ? 'bg-accent' : ''
          )}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('italic') ? 'bg-accent' : ''
          )}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        
        <Popover open={showLinkInput} onOpenChange={setShowLinkInput}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={openLinkInput}
              className={cn(
                "h-8 w-8 p-0",
                editor.isActive('link') ? 'bg-accent' : ''
              )}
              aria-label="Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">
                {hasSelection ? 'Edit Link' : 'Insert Link'}
              </h4>
              
              <Input
                type="text"
                placeholder="https://example.com or email@example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyLink()
                  }
                }}
                className="rounded-full"
                autoFocus
              />
              
              <Input
                type="text"
                placeholder="Link text (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    applyLink()
                  }
                }}
                className="rounded-full"
              />
              
              <div className="flex items-center gap-2">
                {hasSelection && editor.isActive('link') && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={removeLink}
                    className="flex-1"
                  >
                    Remove
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={applyLink}
                  className="flex-1"
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('bulletList') ? 'bg-accent' : ''
          )}
          aria-label="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('orderedList') ? 'bg-accent' : ''
          )}
          aria-label="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive('taskList') ? 'bg-accent' : ''
          )}
          aria-label="Task List"
        >
          <ListTodo className="h-4 w-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
          aria-label="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
          aria-label="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <div 
        className="flex-1 overflow-y-auto flex flex-col"
        style={{
          WebkitUserSelect: 'text',
          userSelect: 'text',
          WebkitTouchCallout: 'default',
          touchAction: 'manipulation',
        } as React.CSSProperties}
      >
        <EditorContent 
          editor={editor} 
          className="flex-1"
          style={{
            WebkitUserSelect: 'text',
            userSelect: 'text',
            WebkitTouchCallout: 'default',
            touchAction: 'manipulation',
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

export function TiptapHelpDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden md:inline-flex text-muted-foreground hover:text-foreground"
        >
          <Lightbulb className="h-4 w-4 mr-1.5" />
          Formatting tips & shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Formatting tips & shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
              {/* Text Formatting */}
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-3">Text Formatting</h3>
                <div className="space-y-3 text-base">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Bold</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl/Cmd + B</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Italic</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl/Cmd + I</kbd>
                  </div>
                </div>
              </div>

              {/* Lists */}
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-3">Lists</h3>
                <div className="space-y-3 text-base">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-normal">Bullet list</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl/Cmd + Shift + 8</kbd>
                    </div>
                    <p className="text-muted-foreground text-base">
                      Type <kbd className="px-1 py-0.5 bg-muted/50 rounded text-sm">-</kbd> or <kbd className="px-1 py-0.5 bg-muted/50 rounded text-sm">*</kbd> followed by space at line start
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Numbered list</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl/Cmd + Shift + 7</kbd>
                    </div>
                    <p className="text-muted-foreground text-base">
                      Type <kbd className="px-1 py-0.5 bg-muted/50 rounded text-sm">1.</kbd> followed by space at line start
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Task list</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl/Cmd + Shift + 9</kbd>
                    </div>
                    <p className="text-muted-foreground text-base">
                      Type <kbd className="px-1 py-0.5 bg-muted/50 rounded text-sm">[ ]</kbd> or <kbd className="px-1 py-0.5 bg-muted/50 rounded text-sm">[x]</kbd> followed by space at line start
                    </p>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-3">Links</h3>
                <div className="space-y-2 text-base">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Toolbar:</span> Click the link button to add or edit links
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Auto-link:</span> Paste a URL (e.g., https://example.com) and it becomes clickable automatically
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Email links:</span> Enter an email address (e.g., recruiter@company.com) to create a mailto link that opens your email client
                  </p>
                </div>
              </div>

              {/* Paragraph Breaks */}
              <div className="border-b border-border pb-6">
                <h3 className="font-semibold mb-3">Paragraphs & Line Breaks</h3>
                <div className="space-y-2 text-base">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">New paragraph:</span> Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-sm text-foreground">Enter</kbd>
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Line break:</span> Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-sm text-foreground">Shift + Enter</kbd>
                  </p>
                </div>
              </div>

              {/* Undo/Redo */}
              <div>
                <h3 className="font-semibold mb-3">Undo & Redo</h3>
                <div className="space-y-2 text-base">
                  <div className="flex items-center justify-between">
                    <span>Undo</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl/Cmd + Z</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Redo</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-sm">Ctrl/Cmd + Shift + Z</kbd>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
  )
}
