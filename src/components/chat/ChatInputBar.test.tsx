import { render, screen, fireEvent } from '@testing-library/react';
import ChatInputBar from './ChatInputBar';

describe('ChatInputBar', () => {
  it('renders input and send button', () => {
    render(<ChatInputBar onSendMessage={jest.fn()} isGenerating={false} />);
    expect(screen.getByPlaceholderText(/message pulse/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
  });

  it('calls onSendMessage when form is submitted', () => {
    const onSendMessage = jest.fn();
    render(<ChatInputBar onSendMessage={onSendMessage} isGenerating={false} />);
    const input = screen.getByPlaceholderText(/message pulse/i);
    fireEvent.change(input, { target: { value: 'Hello world!' } });
    fireEvent.click(screen.getByLabelText(/send message/i));
    // Wait for lock timeout
    setTimeout(() => {
      expect(onSendMessage).toHaveBeenCalledWith('Hello world!', null);
    }, 1100);
  });
}); 