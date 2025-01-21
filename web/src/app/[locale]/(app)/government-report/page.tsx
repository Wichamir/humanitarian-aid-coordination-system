import { Flex } from '@chakra-ui/react';
import EventsPage from './events-page';
import ReportsPage from './reports-page';

export default function GovernmentPanel() {
    return <Flex>
        <EventsPage/>
        <ReportsPage/>
    </Flex>;
}
