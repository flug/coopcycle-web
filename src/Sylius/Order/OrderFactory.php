<?php

namespace AppBundle\Sylius\Order;

use AppBundle\Entity\LocalBusiness;
use AppBundle\Service\SettingsManager;
use Sylius\Component\Channel\Context\ChannelContextInterface;
use Sylius\Component\Resource\Factory\FactoryInterface;
use Sylius\Component\Taxation\Calculator\CalculatorInterface;

class OrderFactory implements FactoryInterface
{
    /**
     * @var FactoryInterface
     */
    private $factory;

    /**
     * @var ChannelContextInterface
     */
    private $channelContext;

    /**
     * @param FactoryInterface $factory
     */
    public function __construct(FactoryInterface $factory, ChannelContextInterface $channelContext)
    {
        $this->factory = $factory;
        $this->channelContext = $channelContext;
    }

    /**
     * {@inheritdoc}
     */
    public function createNew()
    {
        $order = $this->factory->createNew();
        $order->setChannel($this->channelContext->getChannel());

        return $order;
    }

    public function createForRestaurant(LocalBusiness $restaurant)
    {
        $order = $this->createNew();
        $order->setRestaurant($restaurant);

        if (!$restaurant->isFulfillmentMethodEnabled('delivery') && $restaurant->isFulfillmentMethodEnabled('collection')) {
            $order->setTakeaway(true);
        }

        return $order;
    }
}
